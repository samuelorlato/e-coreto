import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from './ui/Form';

/** Campo de senha com botão de mostrar/esconder (dispensa o "confirme a senha"). */
export function PasswordInput({ autoComplete, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input type={visible ? 'text' : 'password'} autoComplete={autoComplete} className="pr-12" {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-1 my-auto flex size-10 items-center justify-center rounded-full text-fg-subtle hover:text-fg"
        aria-label={visible ? 'Esconder senha' : 'Mostrar senha'}
        aria-pressed={visible}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
