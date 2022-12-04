import React from "react";

import "./index.scss";

interface Props {
  name: string;
  checked: boolean;
  editable: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ToggleSwitch: React.FC<Props> = (props: Props) => {
  return (
    <div className="toggle-switch">
      <input
        className="toggle-switch-checkbox"
        name={props.name}
        id={props.name}
        type="checkbox"
        checked={props.checked}
        disabled={!props.editable}
        onChange={props.onChange}
      />
      <label className="toggle-switch-label" htmlFor={props.name}>
        <span className="toggle-switch-switch" />
      </label>
    </div>
  );
};

export default ToggleSwitch;
