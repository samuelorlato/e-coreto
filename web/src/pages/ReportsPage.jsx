import { Link } from 'react-router';
import { reportsApi } from '../services/api';
import { useApi } from '../hooks/useApi';
import { formatDecimal, formatNumber, formatPercent, formatZip, plural } from '../lib/format';
import { Page, PageHeader, Section } from '../components/ui/Page';
import { ErrorAlert, PageLoader, Skeleton } from '../components/ui/Feedback';
import { StatusLabel } from '../components/proposals/Status';

function Rate({ label, rate, detail }) {
  return (
    <li className="bg-canvas p-6">
      <p className="text-sm text-fg-subtle">{label}</p>
      <p className="mt-2 text-4xl font-semibold tracking-tight text-fg">{formatPercent(rate)}</p>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-accent-soft" aria-hidden="true">
        <div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${Math.min(rate, 100)}%` }} />
      </div>
      <p className="mt-3 text-sm text-fg-subtle">{detail}</p>
    </li>
  );
}

function Days({ label, days }) {
  return (
    <li className="bg-canvas p-6">
      <p className="text-sm text-fg-subtle">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-fg">
        {days == null ? '—' : formatDecimal(days)}
        {days != null && <span className="ml-1.5 text-base font-normal text-fg-subtle">dias</span>}
      </p>
    </li>
  );
}

function Legend() {
  return (
    <p className="flex items-center gap-4 text-sm text-fg-subtle" aria-hidden="true">
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-favor" />a favor
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-against" />
        contra
      </span>
    </p>
  );
}

function Loading({ error, onRetry, rows = 3 }) {
  if (error) return <ErrorAlert error={error} onRetry={onRetry} />;
  return (
    <div className="space-y-4" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-8" />
      ))}
    </div>
  );
}

export function ReportsPage() {
  // Tudo de uma vez: a página aparece completa, sem seções "pulando" enquanto carregam (CLS).
  const report = useApi(async () => {
    const [participation, avg, ranking, byCategory, regions, stale] = await Promise.all([
      reportsApi.participation(),
      reportsApi.avgTime(),
      reportsApi.ranking(5),
      reportsApi.byCategory(),
      reportsApi.votesByRegion(),
      reportsApi.stale(),
    ]);
    return { participation, avg, ranking, byCategory, regions, stale };
  }, []);

  if (!report.data) {
    return report.error ? (
      <Page width="wide">
        <ErrorAlert error={report.error} onRetry={report.reload} />
      </Page>
    ) : (
      <PageLoader label="Calculando indicadores" />
    );
  }

  const done = (data) => ({ data, error: null, reload: report.reload });
  const participation = done(report.data.participation);
  const avg = done(report.data.avg);
  const ranking = done(report.data.ranking);
  const byCategory = done(report.data.byCategory);
  const regions = done(report.data.regions);
  const stale = done(report.data.stale);

  const p = participation.data;
  const maxRank = Math.max(1, ...(ranking.data || []).map((r) => Math.max(r.inFavor, r.against)));
  const maxCategory = Math.max(1, ...(byCategory.data || []).map((c) => c.proposals));
  const topRegions = (regions.data || []).slice(0, 6);
  const maxRegion = Math.max(1, ...topRegions.map((r) => r.totalVotes));

  return (
    <Page width="wide">
      <PageHeader title="Indicadores" subtitle="Como o bairro participa e como a prefeitura responde." />

      <Section title="Participação">
        {!p ? (
          <Loading error={participation.error} onRetry={participation.reload} rows={2} />
        ) : (
          <ul className="grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
            <Rate label="Moradores que votaram" rate={p.participationRate} detail={`${formatNumber(p.residentsWhoVoted)} de ${formatNumber(p.residents)}`} />
            <Rate label="Atingiram o limiar" rate={p.thresholdRate} detail={`${formatNumber(p.reachedThreshold)} de ${plural(p.proposals, 'proposta', 'propostas')}`} />
            <Rate label="Com resposta oficial" rate={p.responseRate} detail={`${formatNumber(p.responded)} de ${formatNumber(p.reachedThreshold)} que atingiram`} />
            <Rate label="Aprovadas e concluídas" rate={p.executionRate} detail={`${formatNumber(p.completed)} de ${formatNumber(p.approved)} aprovadas`} />
          </ul>
        )}
      </Section>

      <Section title="Tempo médio desde a criação" className="mt-20">
        {!avg.data ? (
          <Loading error={avg.error} onRetry={avg.reload} rows={1} />
        ) : (
          <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line lg:grid-cols-4">
            <Days label="Até atingir o limiar" days={avg.data.avgDaysToThreshold} />
            <Days label="Até a decisão" days={avg.data.avgDaysToDecision} />
            <Days label="Até começar a execução" days={avg.data.avgDaysToExecution} />
            <Days label="Até a conclusão" days={avg.data.avgDaysToCompletion} />
          </ul>
        )}
      </Section>

      <div className="mt-20 grid gap-20 lg:grid-cols-2 lg:gap-16">
        <Section title="Mais apoiadas" action={<Legend />}>
          {!ranking.data ? (
            <Loading error={ranking.error} onRetry={ranking.reload} />
          ) : (
            <ol className="space-y-6">
              {ranking.data.map((r) => (
                <li key={r.id}>
                  <Link to={`/propostas/${r.id}`} viewTransition className="font-medium text-fg underline-offset-4 hover:text-accent hover:underline">
                    {r.title}
                  </Link>
                  <div className="mt-2 flex items-center gap-4">
                    <div
                      className="grid h-2 flex-1 grid-cols-2"
                      role="img"
                      aria-label={`${r.inFavor} a favor, ${r.against} contra`}
                    >
                      <div className="flex justify-end pr-px">
                        <div className="h-full rounded-l-full bg-against" style={{ width: `${(r.against / maxRank) * 100}%` }} />
                      </div>
                      <div className="pl-px">
                        <div className="h-full rounded-r-full bg-favor" style={{ width: `${(r.inFavor / maxRank) * 100}%` }} />
                      </div>
                    </div>
                    <span className="w-16 shrink-0 text-right text-sm text-fg-subtle tabular-nums">
                      {r.inFavor} · {r.against}
                    </span>
                  </div>
                  <StatusLabel status={r.status} className="mt-2 text-sm text-fg-subtle" />
                </li>
              ))}
            </ol>
          )}
        </Section>

        <Section title="Por categoria">
          {!byCategory.data ? (
            <Loading error={byCategory.error} onRetry={byCategory.reload} />
          ) : (
            <ul className="space-y-4">
              {byCategory.data.map((c) => (
                <li key={c.id} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-4">
                  <span className="truncate text-sm text-fg-muted" title={c.name}>
                    {c.name}
                  </span>
                  <div className="h-2 rounded-full" role="img" aria-label={`${c.name}: ${plural(c.proposals, 'proposta', 'propostas')}`}>
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: c.proposals ? `${(c.proposals / maxCategory) * 100}%` : '2px', opacity: c.proposals ? 1 : 0.3 }}
                    />
                  </div>
                  <span className="text-sm text-fg-subtle tabular-nums">{c.proposals}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <div className="mt-20 grid gap-20 lg:grid-cols-2 lg:gap-16">
        <Section title="Votos por região" action={<Legend />}>
          {!regions.data ? (
            <Loading error={regions.error} onRetry={regions.reload} />
          ) : (
            <ul className="space-y-5">
              {topRegions.map((r) => (
                <li key={`${r.zipCode}-${r.street}`}>
                  <div className="flex items-baseline justify-between gap-4 text-sm">
                    <span className="text-fg">
                      {r.street} <span className="text-fg-subtle">· {formatZip(r.zipCode)}</span>
                    </span>
                    <span className="text-fg-subtle tabular-nums">{plural(r.totalVotes, 'voto', 'votos')}</span>
                  </div>
                  <div
                    className="mt-2 flex h-2 gap-0.5"
                    style={{ width: `${(r.totalVotes / maxRegion) * 100}%` }}
                    role="img"
                    aria-label={`${r.inFavor} a favor, ${r.against} contra`}
                  >
                    {r.inFavor > 0 && <div className="h-full rounded-full bg-favor" style={{ flex: r.inFavor }} />}
                    {r.against > 0 && <div className="h-full rounded-full bg-against" style={{ flex: r.against }} />}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Paradas há muito tempo">
          {!stale.data ? (
            <Loading error={stale.error} onRetry={stale.reload} rows={1} />
          ) : stale.data.length === 0 ? (
            <p className="text-fg-muted">Nenhuma proposta parada além do prazo.</p>
          ) : (
            <ul className="divide-y divide-line border-y border-line">
              {stale.data.map((s) => (
                <li key={s.id} className="flex items-baseline justify-between gap-4 py-4">
                  <Link to={`/propostas/${s.id}`} viewTransition className="min-w-0 text-fg underline-offset-4 hover:text-accent hover:underline">
                    {s.title}
                  </Link>
                  <span className="shrink-0 text-sm text-fg-subtle">{plural(s.daysOpen, 'dia', 'dias')}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </Page>
  );
}
