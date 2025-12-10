import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const ModuleCard = ({
  icon,
  title,
  description,
  gradient,
  components,
  status = 'active',
  index = 0
}) => {
  const statusConfig = {
    active: {
      badge: '✅ ACTIVO',
      badgeColor: 'bg-green-500',
    },
    soon: {
      badge: '🚀 PRÓXIMAMENTE',
      badgeColor: 'bg-orange-500',
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      whileHover={{
        y: -10,
        transition: { duration: 0.2 }
      }}
      className="group relative"
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500"
           style={{ background: gradient }}
      />

      {/* Main card */}
      <div className="relative glass rounded-3xl p-8 h-full flex flex-col transition-all duration-300 border-2 border-transparent group-hover:border-white/50">
        {/* Header */}
        <div className="relative mb-6">
          {/* Gradient background for icon */}
          <div
            className="absolute inset-0 rounded-2xl blur-xl opacity-30"
            style={{ background: gradient }}
          />
          <div
            className="relative w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-2xl"
            style={{ background: gradient }}
          >
            {icon}
          </div>
        </div>

        {/* Status badge */}
        <div className="mb-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white ${statusConfig[status].badgeColor} shadow-lg`}>
            {statusConfig[status].badge}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          {title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 leading-relaxed mb-6 flex-grow">
          {description}
        </p>

        {/* Components list */}
        <div className="space-y-3 mb-6">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Incluye:
          </h4>
          {components.map((component, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 + idx * 0.05 }}
              className="flex items-center space-x-2"
            >
              <CheckCircle2 size={16} className="text-secondary flex-shrink-0" />
              <span className="text-sm text-gray-600">{component}</span>
            </motion.div>
          ))}
        </div>

        {/* CTA button */}
        <motion.button
          whileHover={{ x: 5 }}
          className="flex items-center space-x-2 text-sm font-semibold text-primary group-hover:text-secondary transition-colors"
        >
          <span>Explorar módulo</span>
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ModuleCard;
