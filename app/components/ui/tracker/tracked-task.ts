import Component from "@glimmer/component";
import { TrackedDay } from "jikan-ga-nai/interfaces/tracked-day";
import moment from "moment";
import { action, computed } from "@ember/object";
import { ScaleTime } from "d3-scale";
import { tracked } from "@glimmer/tracking";
// @ts-ignore
import move from "ember-animated/motions/move";
// @ts-ignore
import { fadeOut, fadeIn } from "ember-animated/motions/opacity";
import { easeOut, easeIn } from "ember-animated/easings/cosine";
import { TrackedTask } from "jikan-ga-nai/interfaces/tracked-task";
import { ChargeCode } from "jikan-ga-nai/interfaces/charge-code";

import { TimeBlock } from "jikan-ga-nai/interfaces/time-block";

import { queryManager, unsubscribe } from "ember-apollo-client";

import CustomApolloService from "jikan-ga-nai/services/custom-apollo";

import mutationDeleteTimeBlock from "jikan-ga-nai/gql/mutations/deleteTimeBlock.graphql";
import mutationCreateTimeBlock from "jikan-ga-nai/gql/mutations/createTimeBlock.graphql";
import mutationUpdateTrackedTask from "jikan-ga-nai/gql/mutations/updateTrackedTask.graphql";
import mutationDeleteTrackedTask from "jikan-ga-nai/gql/mutations/deleteTrackedTask.graphql";
import queryTimeBlocks from "jikan-ga-nai/gql/queries/timeBlocks.graphql";

import { task } from "ember-concurrency-decorators";

interface UiTrackedTaskArgs {
  day: TrackedDay;
  trackedTask: TrackedTask;
  scale: ScaleTime<Number, Number>;
  ticks: Date[];
  chargeCodes: [ChargeCode];
  trackedDay: TrackedDay;
}

class DateBlock {
  @tracked selected = false;
  @tracked private timeBlock: TimeBlock | null = null;
  @tracked checked = false;

  date: Date;

  mouseOver = false;
  mouseDown = false;

  constructor(date: Date) {
    this.date = date;
  }

  setTimeBlock(val: TimeBlock | null) {
    this.timeBlock = val;
    this.checked = !!val;
  }
  getTimeBlock() {
    return this.timeBlock;
  }
  getTimeBlockId() {
    return this.timeBlock?.id;
  }
}

export default class UiTrackedDay extends Component<UiTrackedTaskArgs> {
  @queryManager({ service: "custom-apollo" }) apollo!: CustomApolloService;

  lastBlockClicked: number | null = null;
  selectedBlocks: number[] = [];

  @tracked timeBlocks?: TimeBlock[];

  constructor(owner: unknown, args: UiTrackedTaskArgs) {
    super(owner, args);
  }

  willDestroy() {
    if (this.timeBlocks) {
      unsubscribe(this.timeBlocks);
    }
  }

  @action
  async didInsert() {
    // fetch timeblocks
    this.timeBlocks = await this.apollo.watchQuery(
      {
        query: queryTimeBlocks,
        variables: {
          trackedTaskId: this.args.trackedTask.id,
        },
      },
      "timeBlocks"
    );
  }

  @action
  deleteTrackedTask() {
    this.apollo.mutate({
      mutation: mutationDeleteTrackedTask,
      variables: {
        id: this.args.trackedTask.id,
      },
      updateQueries: {
        trackedTasks: (prev, { mutationResult, queryVariables }) => {
          this.args.trackedTask;
          if (this.args.trackedDay.id === queryVariables.trackedDayId) {
            let deletedId = mutationResult?.data?.deleteTrackedTask;
            if (deletedId) {
              const toRemove = prev.trackedTasks.edges.find(
                (task: TrackedTask) => task.id === deletedId
              );
              if (toRemove) {
                prev.trackedTasks.edges.removeObject(toRemove);
              }
            }
          }
          return prev;
        },
      },
    });
  }

  @action
  didResize() {}

  @action
  updateChargeCodes(selection: ChargeCode[]) {
    const chargeCodeIds: string[] = [];
    selection.forEach((cc) => chargeCodeIds.push(cc.id));

    this.apollo.mutate({
      mutation: mutationUpdateTrackedTask,
      variables: {
        id: this.args.trackedTask.id,
        chargeCodeIds: chargeCodeIds,
      },
    });
  }

  @action
  updateNotes(e: KeyboardEvent) {
    const target = e.target;

    if (target instanceof HTMLInputElement) {
      const notes = target.value;

      if (notes !== this.args.trackedTask.notes) {
        this.apollo.mutate({
          mutation: mutationUpdateTrackedTask,
          variables: {
            id: this.args.trackedTask.id,
            notes: notes,
          },
        });
      }
    }
  }

  /**
   * Using @computed here for performance reasons. It was overly eager
   * to re-caclculate when only the TimeBlocks had changed
   */
  @computed("args.ticks.[]")
  get squares() {
    if (!this.args.ticks) {
      return [];
    }

    const blocks: DateBlock[] = [];
    this.args.ticks.forEach((tick) => {
      // each tick is at the hour border, we want 4 blocks per hour
      const date = moment(tick);

      for (let i = 0; i < 4; i++) {
        if (i > 0) {
          date.add(15, "minutes");
        }
        // this date is local time
        const dateBlockDate = date.toDate();
        const dateBlock = new DateBlock(dateBlockDate);

        blocks.push(dateBlock);
      }
    });

    return blocks;
  }

  @computed("timeBlocks.[]", "squares.[]")
  get squaresWithTimeBlocks() {
    const squares = this.squares;

    const timeBlocks = this.timeBlocks;

    const timeBlockMap = new Map<number, TimeBlock>();

    timeBlocks?.forEach((block) => {
      // convert to local time
      const time = new Date(block.startTime).getTime();
      timeBlockMap.set(time, block);
    });

    squares.forEach((square) => {
      const datetime = square.date.getTime();
      const block = timeBlockMap.get(datetime);
      if (block) {
        square.setTimeBlock(block);
      }
    });

    return squares;
  }

  // @task({ enqueue: true })
  // updateCache: any = function* () {};

  @task({ enqueue: true, maxConcurrency: 5 })
  timeBlockStateChange: any = function* (
    this: UiTrackedDay,
    block: DateBlock,
    state: boolean
  ) {
    if (state) {
      // optimistically setting this before graphql results for speed
      // block.checked = true;

      /*
      Note: If this mutation was actually updateTrackedTask and passed in
      all the timeblocks instead (inefficient), then we wouldn't need to
      run updateQueries to update the cache as it will auto-update, like
      how updateChargeCodes function works.
      */
      // create a TimeBlock
      yield this.apollo.mutate({
        mutation: mutationCreateTimeBlock,
        variables: {
          trackedTaskId: this.args.trackedTask.id,
          startTime: block.date.getTime(),
          minutes: null,
        },
        updateQueries: {
          timeBlocks: (prev, { mutationResult, queryVariables }) => {
            if (queryVariables.trackedTaskId === this.args.trackedTask.id) {
              if (mutationResult?.data?.createTimeBlock) {
                prev.timeBlocks.pushObject(mutationResult.data.createTimeBlock);
              }
            }
            return prev;
          },
        },
      });
    } else if (block.getTimeBlockId()) {
      const timeBlockId = block.getTimeBlockId();

      // optimistacally setting this before graphql results for speed
      // block.checked = false;

      // delete a TimeBlock
      yield this.apollo.mutate({
        mutation: mutationDeleteTimeBlock,
        variables: {
          id: timeBlockId,
        },
        updateQueries: {
          timeBlocks: (prev, { mutationResult, queryVariables }) => {
            if (queryVariables.trackedTaskId === this.args.trackedTask.id) {
              const id = mutationResult?.data?.deleteTimeBlock;
              if (id) {
                const removed = prev.timeBlocks.findBy("id", id);
                if (removed) {
                  prev.timeBlocks.removeObject(removed);
                  block.setTimeBlock(null);
                }
              }
            }

            return prev;
          },
        },
      });
    }

    // yield timeout(25);
  };

  *transitionChecked({ removedSprites, insertedSprites }: any) {
    insertedSprites.forEach((sprite: any) => {
      // sprite.moveToFinalPosition();
      sprite.startAtPixel({
        x: sprite.absoluteFinalBounds.x,
        y: sprite.absoluteFinalBounds.y,
      });
      fadeIn(sprite, { easing: easeOut, duration: 200 });
      move(sprite);
    });
    removedSprites.forEach((sprite: any) => {
      sprite.endAtPixel({ y: 0 });
      move(sprite, { easing: easeIn });
      fadeOut(sprite);
    });
  }

  @action
  clearSelections() {
    this.squares.forEach((block) => {
      block.selected = false;
    });
    this.lastBlockClicked = null;
  }

  @action
  mouseDown(block: DateBlock, e: MouseEvent) {
    // record if they've left-clicked down
    if (e.buttons === 1) {
      block.mouseDown = true;
    }
  }

  @action
  async mouseLeave(block: DateBlock, e: MouseEvent) {
    // if they're leaving and still clicking down, flag box checked
    // and reset mouseDown, mouseOver
    if (block.mouseDown && e.buttons === 1) {
      await this.timeBlockStateChange.perform(block, !block.checked);
    }
    block.mouseDown = false;
    block.mouseOver = false;
  }

  @action
  async mouseOver(block: DateBlock, e: MouseEvent) {
    // if we'ver mouse-over and still left-clicking, flag box checked
    if (!block.mouseOver && e.buttons === 1) {
      block.mouseOver = true;
      await this.timeBlockStateChange.perform(block, !block.checked);
    }
  }

  @action
  async mouseClick(block: DateBlock, e: MouseEvent) {
    block.mouseDown = false;
    if (e.shiftKey) {
      // take the last clicked date, up to current clicked date, and select everything in b/w
      // don't actually toggle anything yet, but highlight them
      if (this.lastBlockClicked) {
        const squareOfLastClicked = this.squares.find(
          (square) => square.date.getTime() === this.lastBlockClicked
        );
        if (squareOfLastClicked) {
          const startIndex = this.squares.indexOf(squareOfLastClicked);
          const endIndex = this.squares.indexOf(block);

          let start = startIndex;
          let end = endIndex;
          if (startIndex > endIndex) {
            // going backwards
            start = endIndex;
            end = startIndex;
          }

          for (let i = start; i <= end; i++) {
            this.squares[i].selected = true;
          }
        }
      }
    } else {
      // on mouse click, this currently will toggle the checked state
      // while also setting up the last block clicked

      this.lastBlockClicked = block.date.getTime();
      // clear all other selections
      this.squares.forEach((block) => (block.selected = false));

      await this.timeBlockStateChange.perform(block, !block.checked);
    }
  }

  @action
  async keyUp(block: DateBlock, e: KeyboardEvent) {
    e.preventDefault;
    if (e.code === "Space") {
      // made a selection
      let selected = this.squares.filterBy("selected");
      if (selected.length) {
        const setCheckAll = !!selected.filter((block) => !block.checked).length;
        // if one time block within the selection is not checked, we will
        // set all time blocks in selection to checked

        // filter the ones in selected that don't match setCheckAll
        selected = selected
          .filter((square) => square.checked !== setCheckAll)
          .sortBy("date");

        for (let block of selected) {
          await this.timeBlockStateChange.perform(block, setCheckAll);
        }
      }
    } else if (e.code === "Tab") {
      this.lastBlockClicked = block.date.getTime();
      // clear all other selections
      this.squares.forEach((block) => (block.selected = false));
      block.selected = true;
    }
  }
}
