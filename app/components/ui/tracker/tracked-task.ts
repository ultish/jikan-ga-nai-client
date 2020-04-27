import Component from "@glimmer/component";
import { TrackedDay } from "jikan-ga-nai/interfaces/tracked-day";
import moment from "moment";
import { action, computed } from "@ember/object";
import { ScaleTime } from "d3-scale";
import { tracked } from "@glimmer/tracking";

interface UiTrackedTaskArgs {
  day: TrackedDay;
  scale: ScaleTime<Number, Number>;
  ticks: Date[];
}

class TimeBlock {
  @tracked selected = false;
  @tracked checked = false;
  date: Date;

  constructor(date: Date) {
    this.date = date;
  }
}

export default class UiTrackedDay extends Component<UiTrackedTaskArgs> {
  lastBlockClicked: TimeBlock | null = null;
  selectedBlocks: TimeBlock[] = [];

  constructor(owner: unknown, args: UiTrackedTaskArgs) {
    super(owner, args);
  }

  @action
  didResize() {
    console.log("resized!");
  }

  @action
  clearSelections() {
    this.squares.forEach((block) => {
      block.selected = false;
    });
    this.lastBlockClicked = null;
  }

  @action
  clickBlock(block: TimeBlock, e: KeyboardEvent | MouseEvent) {
    debugger;
    e.preventDefault;
    if (e instanceof KeyboardEvent) {
      if (e.code === "Space") {
        // made a selection
        const selected = this.squares.filterBy("selected");
        if (selected.length) {
          const setCheckAll = !!selected.filter((block) => !block.checked)
            .length;
          // if one time block within the selection is not checked, we will
          // set all time blocks in selection to checked

          selected.forEach((block) => {
            block.checked = setCheckAll;
            // block.selected = false;
          });
          this.lastBlockClicked = null;
        }
      } else if (e.code === "Tab") {
        this.lastBlockClicked = block;
        // clear all other selections
        this.squares.forEach((block) => (block.selected = false));
        block.selected = true;
      }
    } else if (e instanceof MouseEvent) {
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

        // block.selected = true;
        block.checked = !block.checked;
      }
    }

    console.log(block, e);
  }

  /**
   * Using @computed here as I want to keep the same instances of TimeBlock
   */
  @computed("args.ticks.[]")
  get squares() {
    if (!this.args.ticks) {
      return [];
    }
    const blocks: TimeBlock[] = [];
    this.args.ticks.forEach((tick) => {
      // each tick is at the hour border, we want 3 blocks per hour
      const date = moment(tick);

      for (let i = 0; i < 4; i++) {
        if (i > 0) {
          date.add(15, "minutes");
        }
        blocks.push(new TimeBlock(date.toDate()));
      }
    });
    return blocks;
  }
}
