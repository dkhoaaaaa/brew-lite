import { LoadingState } from "../components/LoadingState";

export default function GlobalLoading() {
  return <LoadingState fullPage={true} message="Đang tải dữ liệu BrewLite..." />;
}
