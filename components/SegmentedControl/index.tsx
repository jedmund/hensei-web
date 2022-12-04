import React from "react";

import "./index.scss";

interface Props {
  elementClass?: string;
}

const SegmentedControl: React.FC<Props> = ({ elementClass, children }) => {
  return (
    <div className="SegmentedControlWrapper">
      <div className={`SegmentedControl ${elementClass ? elementClass : ""}`}>
        {children}
      </div>
    </div>
  );
};

export default SegmentedControl;
