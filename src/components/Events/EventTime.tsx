import { CaretDownOutlined } from "@ant-design/icons";
import { Select } from "antd";
import { FC } from "react";
import SvgIcons from "../SvgIcons";
import dayjs, { Dayjs } from "dayjs";

const EventTime: FC<{ min: number; onChangeTimeRange: (time: number, type: string) => void; type: string }> = ({
  min,
  onChangeTimeRange,
  type,
}) => {
  let currentHour = Math.floor(min / 60);
  let currentMin = min / 60;

  if (currentMin >= 30) {
    currentHour = currentHour + 1;
    currentMin = 0;
  } else {
    currentMin = 30;
  }

  let totalMinPassed = min + currentMin;
  let totalMins = 24 * 60;
  let totalMinLeft = totalMins - totalMinPassed;

  let intervalsLeft = Math.ceil(totalMinLeft / 30);

  const timeIntervals = [];

  for (let i = 0; i < intervalsLeft; i++) {
    const nextTimeInMinutes = totalMinPassed + i * 30;

    const nextHour = Math.floor(nextTimeInMinutes / 60);
    const nextMin = nextTimeInMinutes % 60;

    const formattedTime = `${nextHour}:${nextMin === 0 ? "00" : nextMin}`;

    timeIntervals.push({
      label: formattedTime,
      value: nextTimeInMinutes,
    });

    if (i === 0) {
      const nextTimeInMinutes = totalMinPassed + i * 30;
      console.log(currentHour, i);
      const nextHour = Math.floor(nextTimeInMinutes / 60);
      const nextMin = (nextTimeInMinutes % 60) + 30;
      console.log(nextTimeInMinutes, i, "sadf");
      console.log(nextHour, i);
      console.log(nextMin, i);
    }
  }

  console.log(timeIntervals);
  return (
    <Select
      suffixIcon={<CaretDownOutlined />}
      style={{ width: 100 }}
      allowClear={{ clearIcon: <i>{SvgIcons.cross}</i> }}
      placeholder="Select time"
      defaultValue={timeIntervals[0]}
      onChange={(value) => {
        console.log(value, "event time value");
        onChangeTimeRange(Number(value), type);
      }}
    >
      {timeIntervals.length > 0 &&
        timeIntervals.map((time: any, i) => {
          return (
            <Select.Option key={i} value={time.value}>
              {time.label}
            </Select.Option>
          );
        })}
    </Select>
  );
};

export default EventTime;
