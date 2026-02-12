const StatCard = ({ label, value, icon, tone = "brand" }) => {
  const toneClasses = {
    brand: "bg-brand-50 text-brand-700",
    warning: "bg-warning-50 text-warning-500",
    accent: "bg-accent-50 text-accent-500"
  };

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
        </div>
        {icon && (
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
              toneClasses[tone] || toneClasses.brand
            }`}
          >
            {icon}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;
