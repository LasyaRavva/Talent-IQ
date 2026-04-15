import { useUser } from "@clerk/clerk-react";
import { ArrowRightIcon, LogInIcon, SparklesIcon, ZapIcon } from "lucide-react";

function WelcomeSection({ onCreateSession, joinCode, onJoinCodeChange, onJoinByCode }) {
  const { user } = useUser();

  return (
    <div className="relative overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-6 py-16">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-5xl font-black bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Welcome back, {user?.firstName || "there"}!
              </h1>
            </div>
            <p className="text-lg text-base-content/60 ml-16">
              Ready to level up your coding skills?
            </p>
          </div>

          <div className="flex w-[350px] flex-col gap-4 lg:max-w-md lg:flex-none lg:items-stretch">
            <button
              onClick={onCreateSession}
              className="group w-[300px] px-9 py-4 bg-gradient-to-r from-primary to-secondary rounded-2xl transition-all duration-200 hover:opacity-90"
            >
              <div className="flex items-center gap-3 text-white font-bold text-lg">
                <ZapIcon className="w-6 h-6" />
                <span>Create Session</span>
                <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            <div className="w-[350px] rounded-2xl border border-base-200 bg-base-100/80 p-4 shadow-sm">
              <p className="text-sm font-semibold text-base-content/80 mb-3">Join with room code</p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(event) => onJoinCodeChange(event.target.value)}
                  placeholder="Enter room code"
                  className="input input-bordered flex-1"
                />
                <button type="button" onClick={onJoinByCode} className="btn btn-primary gap-2">
                  <LogInIcon className="w-4 h-4" />
                  Join
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WelcomeSection;
