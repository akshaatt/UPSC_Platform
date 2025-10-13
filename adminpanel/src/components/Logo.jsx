import { ShieldCheck } from "lucide-react";

export default function Logo({ size = 28 }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className="absolute inset-0 rounded-2xl blur-xl bg-cyan-400/30" />
        <div className="relative rounded-2xl p-2 bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg">
          <ShieldCheck size={size} />
        </div>
      </div>
      <span className="font-semibold tracking-wide grad-text">THURSDAY</span>
    </div>
  );
}
