/**
 * SetupChecklist - CITAMED.VE
 * Tarjeta "Prepara tu consultorio" del panel del médico.
 * Reemplaza los pasos largos del registro: cada tarea lleva directo a la pantalla donde se hace.
 * Se oculta sola cuando todo está listo.
 */

import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, ChevronRight, ClipboardCheck } from 'lucide-react';

import { buildSetupTasks } from './setupTasks';

function SetupChecklist({ profile, onSharePublicPage }) {
  const tasks = buildSetupTasks(profile, { onSharePublicPage });
  const required = tasks.filter((t) => !t.optional);
  const doneCount = required.filter((t) => t.done).length;
  if (!profile || doneCount === required.length) return null;

  const percent = Math.round((doneCount / required.length) * 100);

  return (
    <section className="bg-white rounded-2xl shadow-lg border border-teal-100 p-5 md:p-6 mb-8">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <span className="p-2 bg-teal-50 rounded-xl text-teal-600">
            <ClipboardCheck className="w-6 h-6" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Prepara tu consultorio</h2>
            <p className="text-sm text-gray-500">{doneCount} de {required.length} listos</p>
          </div>
        </div>
        <span className="text-sm font-semibold text-teal-700">{percent}%</span>
      </div>

      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
        <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${percent}%` }} />
      </div>

      <ul className="divide-y divide-gray-100">
        {tasks.map((task) => {
          const content = (
            <>
              {task.done
                ? <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0" />
                : <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />}
              <span className="flex-1 min-w-0">
                <span className={`block text-sm font-medium ${task.done ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                  {task.label}{task.optional && <span className="text-gray-400 font-normal"> (opcional)</span>}
                </span>
                {!task.done && <span className="block text-xs text-gray-500">{task.hint}</span>}
              </span>
              {!task.done && <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
            </>
          );
          const cls = 'flex items-center gap-3 py-3 w-full text-left';
          if (task.done) return <li key={task.id} className={cls}>{content}</li>;
          return (
            <li key={task.id}>
              {task.to
                ? <Link to={task.to} className={`${cls} hover:bg-gray-50 rounded-lg px-1`}>{content}</Link>
                : <button type="button" onClick={task.onClick} className={`${cls} hover:bg-gray-50 rounded-lg px-1`}>{content}</button>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default SetupChecklist;
