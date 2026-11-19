import { useEffect, useState } from 'react';
import { Landmark, Lightbulb, Route, Target, ThumbsUp } from 'lucide-react';
import { useThreshold } from '../hooks/useThreshold';
import { cn } from '../lib/cn';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

function steps(threshold) {
  const rule = threshold
    ? `Hoje são pelo menos ${threshold.requiredVotes} votos, com ${threshold.approvalPercentage}% ou mais a favor.`
    : 'É preciso um mínimo de votos e maioria a favor.';
  return [
    {
      icon: Lightbulb,
      title: 'Proponha uma melhoria',
      text: 'Descreva uma ideia para o bairro: um título, um resumo e as categorias certas.',
    },
    {
      icon: ThumbsUp,
      title: 'Os vizinhos votam',
      text: 'Cada pessoa tem um voto por proposta, a favor ou contra. Dá para mudar enquanto a votação estiver aberta.',
    },
    {
      icon: Target,
      title: 'Com apoio, vai para a prefeitura',
      text: `Ao atingir o limiar de apoio, a proposta é encaminhada sozinha. ${rule}`,
    },
    {
      icon: Landmark,
      title: 'A prefeitura responde em público',
      text: 'As autoridades analisam, aprovam ou recusam e publicam respostas que não podem ser apagadas.',
    },
    {
      icon: Route,
      title: 'Acompanhe até o fim',
      text: 'Cada mudança fica registrada no histórico, da votação até a obra concluída.',
    },
  ];
}

export function Tour({ open, initialStep = 0, onClose }) {
  const threshold = useThreshold();
  const list = steps(threshold);
  const [step, setStep] = useState(initialStep);

  useEffect(() => {
    if (open) setStep(initialStep);
  }, [open, initialStep]);

  const last = step === list.length - 1;
  const { icon: Icon, title, text } = list[step];

  function onKeyDown(e) {
    if (e.key === 'ArrowRight' && !last) setStep((s) => s + 1);
    if (e.key === 'ArrowLeft' && step > 0) setStep((s) => s - 1);
  }

  return (
    <Modal open={open} onClose={onClose} ariaLabel="Como funciona o e-Coreto" className="max-w-[26rem]">
      <div onKeyDown={onKeyDown} className="pb-2 text-center">
        <p className="text-xs font-medium tracking-wide text-fg-subtle uppercase">Como funciona</p>
        <div key={step} className="animate-fade-up">
          <span className="mx-auto mt-6 flex size-20 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Icon className="size-9" strokeWidth={1.6} aria-hidden="true" />
          </span>
          <h2 className="mt-6 text-xl font-semibold text-fg" aria-live="polite">
            {title}
          </h2>
          <p className="mx-auto mt-3 max-w-xs leading-relaxed text-fg-muted">{text}</p>
        </div>

        <div className="mt-8 flex justify-center gap-1.5" aria-hidden="true">
          {list.map((s, i) => (
            <span
              key={s.title}
              className={cn('h-1.5 rounded-full transition-all duration-300', i === step ? 'w-6 bg-accent' : 'w-1.5 bg-line-strong')}
            />
          ))}
        </div>
        <p className="sr-only">
          Passo {step + 1} de {list.length}
        </p>

        <div className="mt-8 flex items-center justify-between gap-2">
          <Button variant="ghost" onClick={step === 0 ? onClose : () => setStep((s) => s - 1)}>
            {step === 0 ? 'Pular' : 'Voltar'}
          </Button>
          <Button onClick={last ? onClose : () => setStep((s) => s + 1)}>{last ? 'Começar' : 'Próximo'}</Button>
        </div>
      </div>
    </Modal>
  );
}
