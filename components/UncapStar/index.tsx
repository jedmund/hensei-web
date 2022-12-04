import React from "react";
import classnames from "classnames";

import "./index.scss";

interface Props {
  empty: boolean;
  special: boolean;
  flb: boolean;
  ulb: boolean;
  index: number;
  onClick: (index: number, empty: boolean) => void;
}

const UncapStar = (props: Props) => {
  const classes = classnames({
    UncapStar: true,
    empty: props.empty,
    special: props.special,
    mlb: !props.special,
    flb: props.flb,
    ulb: props.ulb,
  });

  function clicked() {
    props.onClick(props.index, props.empty);
  }

  return <li className={classes} onClick={clicked}></li>;
};

UncapStar.defaultProps = {
  empty: false,
  special: false,
  flb: false,
  ulb: false,
};

export default UncapStar;
