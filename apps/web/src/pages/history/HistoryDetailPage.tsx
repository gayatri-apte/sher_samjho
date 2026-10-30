import { Navigate, useParams } from "react-router-dom";

/** Old /history/:id links now open the full sher page. */
export default function HistoryDetailPage() {
  const { id } = useParams();
  return <Navigate to={id ? `/poetry-ai/${encodeURIComponent(id)}` : "/history"} replace />;
}
