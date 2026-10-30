import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Page, { ErrorNote } from "../../components/ui/Page";
import SherCard, { EmptyState, Skeleton } from "../../components/SherCard";
import FollowPoet from "../../components/FollowPoet";
import { api } from "../../config/api";
import { apiJSON, type Sher } from "../../lib/http";
import { POETS } from "../../data/poets";

export default function PoetDetails() {
  const { name = "" } = useParams();
  const poet = POETS.find((p) => p.name === name);
  const [shers, setShers] = useState<Sher[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiJSON<Sher[]>(api.poet(name))
      .then(setShers)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load"));
  }, [name]);

  return (
    <Page
      title={name}
      subtitle={poet ? `${poet.years} · ${poet.era} — ${poet.note}` : undefined}
    >
      <div className="mb-6 flex items-center gap-3">
        <FollowPoet poetId={name} />
        <Link to="/explorer/poets" className="text-sm text-[#a9552a] hover:underline">All poets</Link>
      </div>
      {error && <ErrorNote>{error}</ErrorNote>}
      {!shers && !error && <Skeleton />}
      {shers && shers.length === 0 && (
        <EmptyState title={`No shers by ${name} in the library yet`}>
          Scan one, or ask an admin to load the classic library.
        </EmptyState>
      )}
      <div className="space-y-3">
        {shers?.map((s) => <SherCard key={s.id} sher={s} />)}
      </div>
    </Page>
  );
}
