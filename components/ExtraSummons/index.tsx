import React from "react";
import { useTranslation } from "next-i18next";
import SummonUnit from "~components/SummonUnit";
import { SearchableObject } from "~types";
import "./index.scss";

// Props
interface Props {
  grid: GridArray<GridSummon>;
  editable: boolean;
  exists: boolean;
  found?: boolean;
  offset: number;
  updateObject: (object: SearchableObject, position: number) => void;
  updateUncap: (id: string, position: number, uncap: number) => void;
}

const ExtraSummons = (props: Props) => {
  const numSummons: number = 2;

  const { t } = useTranslation("common");

  return (
    <div id="ExtraSummons">
      <span>{t("summons.subaura")}</span>
      <ul id="grid_summons">
        {Array.from(Array(numSummons)).map((x, i) => {
          return (
            <li key={`grid_unit_${i}`}>
              <SummonUnit
                editable={props.editable}
                position={props.offset + i}
                unitType={1}
                gridSummon={props.grid[props.offset + i]}
                updateObject={props.updateObject}
                updateUncap={props.updateUncap}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ExtraSummons;
