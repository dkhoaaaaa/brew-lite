import { formatPrice } from "../../../lib/money";
import type { ToppingOption } from "../../../types/product";

type ToppingSelectorProps = {
  toppings: ToppingOption[];
  selectedToppingIds: string[];
  onChange: (toppingIds: string[]) => void;
};

export function ToppingSelector({
  toppings,
  selectedToppingIds,
  onChange,
}: ToppingSelectorProps) {
  if (toppings.length === 0) {
    return <p className="text-xs text-[#667068] italic">Không có topping cho món này.</p>;
  }

  function toggleTopping(id: string) {
    onChange(
      selectedToppingIds.includes(id)
        ? selectedToppingIds.filter((selectedId) => selectedId !== id)
        : [...selectedToppingIds, id],
    );
  }

  return (
    <fieldset className="option-group border-0 p-0 m-0">
      <legend className="flex items-center justify-between w-full font-heading font-bold text-base sm:text-lg text-[#163326] mb-2.5">
        <span>Topping</span>
        <span className="text-xs font-normal text-[#667068] font-sans">Có thể chọn nhiều loại</span>
      </legend>
      <div className="flex flex-col divide-y divide-[#d8d8cb] border-t border-b border-[#d8d8cb]">
        {toppings.map((topping) => {
          const isChecked = selectedToppingIds.includes(topping.id);
          return (
            <label
              className="flex items-center justify-between gap-3 py-3 px-1 cursor-pointer min-h-[44px] hover:bg-white/40 transition-colors"
              key={topping.id}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleTopping(topping.id)}
                  className="w-5 h-5 rounded text-[#254a39] accent-[#254a39] cursor-pointer"
                />
                <span className="text-sm font-medium text-[#17231c]">
                  {topping.name}
                </span>
              </div>
              <span className="text-xs font-semibold text-[#667068]">
                +{formatPrice(topping.price)}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
