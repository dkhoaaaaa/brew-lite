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
    return <p className="option-empty">Không có topping cho món này.</p>;
  }

  function toggleTopping(id: string) {
    onChange(
      selectedToppingIds.includes(id)
        ? selectedToppingIds.filter((selectedId) => selectedId !== id)
        : [...selectedToppingIds, id],
    );
  }

  return (
    <fieldset className="option-group">
      <legend>Topping <span>Có thể chọn nhiều</span></legend>
      <div className="topping-options">
        {toppings.map((topping) => (
          <label className="topping-option" key={topping.id}>
            <input
              type="checkbox"
              checked={selectedToppingIds.includes(topping.id)}
              onChange={() => toggleTopping(topping.id)}
            />
            <span className="topping-option__name">{topping.name}</span>
            <span className="topping-option__price">+{formatPrice(topping.price)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}