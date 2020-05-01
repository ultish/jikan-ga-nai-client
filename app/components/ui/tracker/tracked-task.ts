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

import { htmlSafe } from "@ember/string";

const TIME_BLOCK_WIDTH = 15;

interface UiTrackedTaskArgs {
  day: TrackedDay;
  trackedTask: TrackedTask;
  scale: ScaleTime<Number, Number>;
  ticks: Date[];
}

class DateBlock {
  @tracked selected = false;
  @tracked checked = false;
  date: Date;

  mouseOver = false;
  mouseDown = false;

  constructor(date: Date) {
    this.date = date;
  }
}

export default class UiTrackedDay extends Component<UiTrackedTaskArgs> {
  lastBlockClicked: DateBlock | null = null;
  selectedBlocks: DateBlock[] = [];

  constructor(owner: unknown, args: UiTrackedTaskArgs) {
    super(owner, args);
  }

  @action
  didResize() {
    console.log("resized!");
  }

  get chargedTime() {
    const timeBlocks = this.args.trackedTask.timeBlocks;

    const scale = this.args.scale;

    if (!scale) {
      return [];
    }

    const results = timeBlocks.map((block) => {
      let startTime = new Date(block.startTime);

      let startY = scale(startTime);

      let endY = startY.toPrecision() + TIME_BLOCK_WIDTH;
      if (block.minutes) {
        endY = scale(
          moment(startTime).add(block.minutes, "minutes").toDate()
        ).toPrecision(0);
      }

      return {
        timeBlock: block,
        y: startY,
        width: endY,
        style: htmlSafe(`width: ${endY}; left: ${startY};`),
      };
    });

    return results;
  }

  /**
   * Using @computed here as I want to keep the same instances of TimeBlock
   */
  @computed("args.ticks.[]")
  get squares() {
    if (!this.args.ticks) {
      return [];
    }
    const blocks: DateBlock[] = [];
    this.args.ticks.forEach((tick) => {
      // each tick is at the hour border, we want 3 blocks per hour
      const date = moment(tick);

      for (let i = 0; i < 4; i++) {
        if (i > 0) {
          date.add(15, "minutes");
        }
        blocks.push(new DateBlock(date.toDate()));
      }
    });
    return blocks;
  }

  timeBlockStateChange(block: DateBlock, state: boolean) {}

  *transitionChecked({ removedSprites, insertedSprites }: any) {
    insertedSprites.forEach((sprite: any) => {
      fadeIn(sprite, { easing: easeOut, duration: 200 });
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
  mouseLeave(block: DateBlock, e: MouseEvent) {
    // if they're leaving and still clicking down, flag box checked
    // and reset mouseDown, mouseOver
    if (block.mouseDown && e.buttons === 1) {
      block.checked = !block.checked;
    }
    block.mouseDown = false;
    block.mouseOver = false;
  }

  @action
  mouseOver(block: DateBlock, e: MouseEvent) {
    // if we'ver mouse-over and still left-clicking, flag box checked
    if (!block.mouseOver && e.buttons === 1) {
      block.mouseOver = true;
      block.checked = !block.checked;
    }
  }

  @action
  mouseClick(block: DateBlock, e: MouseEvent) {
    block.mouseDown = false;
    if (e.shiftKey) {
      // take the last clicked date, up to current clicked date, and select everything in b/w
      // don't actually toggle anything yet, but highlight them
      if (this.lastBlockClicked) {
        const startIndex = this.squares.indexOf(this.lastBlockClicked);
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
      // clear the last block
      this.lastBlockClicked = null;
    } else {
      // on mouse click, this currently will toggle the checked state
      // while also setting up the last block clicked

      this.lastBlockClicked = block;
      // clear all other selections
      this.squares.forEach((block) => (block.selected = false));

      block.checked = !block.checked;
    }
  }

  @action
  keyUp(block: DateBlock, e: KeyboardEvent) {
    e.preventDefault;
    if (e.code === "Space") {
      // made a selection
      const selected = this.squares.filterBy("selected");
      if (selected.length) {
        const setCheckAll = !!selected.filter((block) => !block.checked).length;
        // if one time block within the selection is not checked, we will
        // set all time blocks in selection to checked

        selected.forEach((block) => {
          block.checked = setCheckAll;
        });
        this.lastBlockClicked = null;
      }
    } else if (e.code === "Tab") {
      this.lastBlockClicked = block;
      // clear all other selections
      this.squares.forEach((block) => (block.selected = false));
      block.selected = true;
    }
  }
}
