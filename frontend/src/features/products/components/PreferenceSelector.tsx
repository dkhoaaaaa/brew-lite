type PreferenceSelectorProps = {
  sugarPercent: number | null;
  icePercent: number | null;
  onSugarChange: (value: number | null) => void;
  onIceChange: (value: number | null) => void;
};

const sugarOptions = [
  { value: 0, label: "0%" },
  { value: 30, label: "30%" },
  { value: 50, label: "50%" },
  { value: 70, label: "70%" },
  { value: 100, label: "100%" },
];

const iceOptions = [
  { value: 0, label: "Không đá" },
  { value: 30, label: "Ít đá" },
  { value: 50, label: "Giảm đá" },
  { value: 70, label: "Bình thường" },
  { value: 100, label: "Nhiều đá" },
];

export function PreferenceSelector({
  sugarPercent,
  icePercent,
  onSugarChange,
  onIceChange,
}: PreferenceSelectorProps) {
  return (
    <div className="preference-selectors">
      <PreferenceGroup
        legend="Mức đường"
        name="sugar-percent"
        options={sugarOptions}
        selectedValue={sugarPercent}
        onChange={onSugarChange}
      />
      <PreferenceGroup
        legend="Mức đá"
        name="ice-percent"
        options={iceOptions}
        selectedValue={icePercent}
        onChange={onIceChange}
      />
    </div>
  );
}

function PreferenceGroup({
  legend,
  name,
  options,
  selectedValue,
  onChange,
}: {
  legend: string;
  name: string;
  options: Array<{ value: number; label: string }>;
  selectedValue: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <fieldset className="option-group">
      <legend>{legend} <span>Không chọn để giữ công thức mặc định</span></legend>
      <div className="preference-options">
        <label className="preference-option">
          <input
            checked={selectedValue === null}
            name={name}
            onChange={() => onChange(null)}
            type="radio"
          />
          <span>Theo công thức</span>
        </label>
        {options.map((option) => (
          <label className="preference-option" key={option.value}>
            <input
              checked={selectedValue === option.value}
              name={name}
              onChange={() => onChange(option.value)}
              type="radio"
              value={option.value}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
