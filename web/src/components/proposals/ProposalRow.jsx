import { Link, useViewTransitionState } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { relativeTime } from '../../lib/format';
import { StatusLabel, SupportRing } from './Status';

/**
 * Uma proposta na lista: título, resumo curto, uma linha de detalhes e o apoio.
 * O título "voa" até a página da proposta (View Transitions).
 */
export function ProposalRow({ proposal, requiredVotes, index = 0, showAuthor = true }) {
  const p = proposal;
  const href = `/propostas/${p.id}`;
  const transitioning = useViewTransitionState(href);
  const reached = p.status !== 'COLLECTING_VOTES';

  return (
    <li className="animate-fade-up" style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}>
      <Link
        to={href}
        viewTransition
        state={{ preview: p }}
        className="group -mx-4 flex items-center gap-6 rounded-3xl px-4 py-6 transition-colors hover:bg-raised sm:-mx-5 sm:px-5"
      >
        <div className="min-w-0 flex-1">
          <h2
            className="text-lg leading-snug font-semibold text-fg transition-colors group-hover:text-accent"
            style={transitioning ? { viewTransitionName: 'proposal-title' } : undefined}
          >
            {p.title}
          </h2>
          <p className="mt-1.5 line-clamp-2 leading-relaxed text-fg-muted">{p.description}</p>
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-fg-subtle">
            <StatusLabel status={p.status} archived={p.archived} />
            {showAuthor && (
              <>
                <span aria-hidden="true">·</span>
                <span>{p.authorName}</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <time dateTime={p.createdAt}>{relativeTime(p.createdAt)}</time>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SupportRing total={p.votesTotal} required={requiredVotes} reached={reached} archived={p.archived && !reached} />
          <ArrowRight
            className="hidden size-4 -translate-x-1 text-fg-subtle opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100 sm:block"
            aria-hidden="true"
          />
        </div>
      </Link>
    </li>
  );
}
