import React from "react";

/*
 * This comes from https://github.com/paulcollett/react-masonry-css/tree/master
 * I had to change a few things - so running my own fork now.
 */

const DEFAULT_COLUMNS = 2;

export interface MasonryProps {
  breakpointCols?: number | { default: number; [key: number]: number };
  columnClassName?: string;
  className: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columnAttrs?: { [key: string]: any };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  column?: { [key: string]: any };
}

type MasonryPropsType = MasonryProps & React.HTMLProps<HTMLElement>;

class Masonry extends React.Component<MasonryPropsType, { columnCount: number }> {
  private ref;
  private resizeObserver: ResizeObserver | null;
  private _lastRecalculateAnimationFrame: number;

  static defaultProps = {
    breakpointCols: undefined, // optional, number or object { default: number, [key: number]: number }
    className: undefined, // required, string
    columnClassName: undefined, // optional, string

    // Any React children. Typically an array of JSX items
    children: undefined,

    // Custom attributes, however it is advised against
    // using these to prevent unintended issues and future conflicts
    // ...any other attribute, will be added to the container
    columnAttrs: undefined, // object, added to the columns

    // Deprecated props
    // The column property is deprecated.
    // It is an alias of the `columnAttrs` property
    column: undefined,
  };

  constructor(props: MasonryProps) {
    super(props);

    // Correct scope for when methods are accessed externally
    this.reCalculateColumnCount = this.reCalculateColumnCount.bind(this);
    this.reCalculateColumnCountDebounce =
      this.reCalculateColumnCountDebounce.bind(this);

    // default state
    const { breakpointCols } = props;
    let columnCount;
    if (typeof breakpointCols === "number") {
      columnCount = breakpointCols;
    } else if (breakpointCols && breakpointCols.hasOwnProperty("default")) {
      columnCount = breakpointCols.default;
    } else {
      columnCount = DEFAULT_COLUMNS;
    }

    this.ref = React.createRef<HTMLDivElement>();
    this.resizeObserver = null;
    this.state = {
      columnCount,
    };
  }

  componentDidMount() {
    this.reCalculateColumnCount();

    this.resizeObserver = new ResizeObserver(() => {
      this.reCalculateColumnCountDebounce();
    });

    const node = this.ref.current!;
    this.resizeObserver.observe(node);
  }

  componentDidUpdate() {
    this.reCalculateColumnCount();
  }

  componentWillUnmount() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  reCalculateColumnCountDebounce() {
    if (!window || !window.requestAnimationFrame) {
      // IE10+
      this.reCalculateColumnCount();
      return;
    }

    if (window.cancelAnimationFrame) {
      // IE10+
      window.cancelAnimationFrame(this._lastRecalculateAnimationFrame);
    }

    this._lastRecalculateAnimationFrame = window.requestAnimationFrame(() => {
      this.reCalculateColumnCount();
    });
  }

  reCalculateColumnCount() {
    // const windowWidth = (window && window.innerWidth) || Infinity;
    // change to this ref's width for breakpoints
    const windowWidth = (this.ref.current && this.ref.current.offsetWidth) || Infinity;
    let { breakpointCols } = this.props;

    if (windowWidth === Infinity) {
      return;
    }

    // Allow passing a single number to `breakpointCols` instead of an object
    if (typeof breakpointCols === "number") {
      breakpointCols = {
        default: breakpointCols || DEFAULT_COLUMNS,
      };
    }

    let matchedBreakpoint = Infinity;
    let columns = breakpointCols?.default || DEFAULT_COLUMNS;

    for (const breakpoint in breakpointCols) {
      const optBreakpoint = parseInt(breakpoint);
      const isCurrentBreakpoint = optBreakpoint > 0 && windowWidth <= optBreakpoint;

      if (isCurrentBreakpoint && optBreakpoint < matchedBreakpoint) {
        matchedBreakpoint = optBreakpoint;
        columns = breakpointCols[optBreakpoint];
      }
    }

    columns = Math.max(1, columns || 1);

    if (this.state.columnCount !== columns) {
      this.setState({
        columnCount: columns,
      });
    }
  }

  itemsInColumns() {
    const currentColumnCount = this.state.columnCount;
    const itemsInColumns = new Array(currentColumnCount);

    // Force children to be handled as an array
    const items = React.Children.toArray(this.props.children);

    for (let i = 0; i < items.length; i++) {
      const columnIndex = i % currentColumnCount;

      if (!itemsInColumns[columnIndex]) {
        itemsInColumns[columnIndex] = [];
      }

      itemsInColumns[columnIndex].push(items[i]);
    }

    return itemsInColumns;
  }

  renderColumns() {
    const { column, columnAttrs = {}, columnClassName } = this.props;
    const childrenInColumns = this.itemsInColumns();
    const columnWidth = `${100 / childrenInColumns.length}%`;
    let className = columnClassName;

    if (className && typeof className !== "string") {
      this.logDeprecated('The property "columnClassName" requires a string');

      // This is a deprecated default and will be removed soon.
      if (typeof className === "undefined") {
        className = "my-masonry-grid_column";
      }
    }

    const columnAttributes = {
      // NOTE: the column property is undocumented and considered deprecated.
      // It is an alias of the `columnAttrs` property
      ...column,
      ...columnAttrs,
      style: {
        ...columnAttrs.style,
        width: columnWidth,
      },
      className,
    };

    return childrenInColumns.map((items, i) => {
      return (
        <div {...columnAttributes} key={i}>
          {items}
        </div>
      );
    });
  }

  logDeprecated(message: string) {
    console.error("[Masonry]", message);
  }

  render() {
    const {
      // ignored
      children,
      breakpointCols,
      columnClassName,
      columnAttrs,
      column,

      // used
      className,

      ...rest
    } = this.props;

    let classNameOutput = className;

    if (typeof className !== "string") {
      this.logDeprecated('The property "className" requires a string');

      // This is a deprecated default and will be removed soon.
      if (typeof className === "undefined") {
        classNameOutput = "my-masonry-grid";
      }
    }

    return (
      <div {...rest} ref={this.ref} className={classNameOutput}>
        {this.renderColumns()}
      </div>
    );
  }
}

export default Masonry;
