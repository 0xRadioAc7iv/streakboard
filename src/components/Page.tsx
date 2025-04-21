import { useEffect, useRef, useState } from "react";
import { supabase } from "../supabase-client";
import { User } from "@supabase/supabase-js";

type TooltipData = {
  visible: boolean;
  data: ContributionDay | null;
};

type ContributionDay = {
  date: string;
  tasks: string[];
};

type StreakData = ContributionDay[];

interface PageProps {
  user: User;
}

export default function Page({ user }: PageProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [streakData, setStreakData] = useState<StreakData>([]);
  const [taskInput, setTaskInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDay, setSelectedDay] = useState<ContributionDay | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData>({
    visible: false,
    data: null,
  });

  useEffect(() => {
    inputRef.current?.focus();
    const initialData = generateDatesArray();
    setStreakData(initialData);
    fetchTasks(initialData);
  }, []);

  const generateDatesArray = () => {
    const days = 365;
    const dates: ContributionDay[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const formattedDate = date.toISOString().split("T")[0];
      dates.push({
        date: formattedDate,
        tasks: [],
      });
    }
    return dates.reverse();
  };

  const fetchTasks = async (initialData: StreakData = streakData) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("tasks")
        .select("date, task")
        .eq("user_id", user.id);
      if (error) {
        console.error("Error fetching tasks:", error);
        setLoading(false);
        return;
      }
      const tasksByDate: { [key: string]: string[] } = {};
      data?.forEach((task) => {
        if (!tasksByDate[task.date]) {
          tasksByDate[task.date] = [];
        }
        tasksByDate[task.date].push(task.task);
      });
      const updatedStreakData = initialData.map((day) => ({
        ...day,
        tasks: tasksByDate[day.date] || [],
      }));
      setStreakData(updatedStreakData);
    } catch (error) {
      console.error("Unexpected error:", error);
    } finally {
      setLoading(false);
    }
  };

  const storeTask = async (date: string, task: string) => {
    if (!task.trim()) return;
    try {
      const { error } = await supabase.from("tasks").insert([
        {
          date,
          task,
          user_id: user.id,
        },
      ]);
      if (error) {
        console.error("Error storing task:", error);
        return;
      }
      const updatedStreakData = streakData.map((day) => {
        if (day.date === date) {
          return {
            ...day,
            tasks: [...day.tasks, task],
          };
        }
        return day;
      });
      setStreakData(updatedStreakData);
      if (selectedDay?.date === date) {
        setSelectedDay({
          ...selectedDay,
          tasks: [...selectedDay.tasks, task],
        });
      }
    } catch (error) {
      console.error("Unexpected error storing task:", error);
    }
  };

  const getHeatmapColor = (count: number) => {
    const greenIntensity = Math.min(count * 40, 255);
    return `rgb(0, ${greenIntensity}, 0)`;
  };

  const handleAddTask = async () => {
    if (taskInput.trim()) {
      const today = new Date().toISOString().split("T")[0];
      await storeTask(today, taskInput);
      setTaskInput("");
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddTask();
    }
  };

  const renderHeatmap = () => {
    const weeks: ContributionDay[][] = [];

    for (let week = 0; week < Math.ceil(streakData.length / 7); week++) {
      const weekDays = streakData.slice(week * 7, (week + 1) * 7);
      weeks.push(weekDays);
    }

    return (
      <div className="grid grid-flow-col gap-1 auto-cols-max relative">
        {weeks.map((week, weekIndex) => (
          <div key={`week-${weekIndex}`} className="grid grid-rows-7 gap-1">
            {week.map((day, dayIndex) => (
              <div
                key={`${day.date}-${dayIndex}`}
                className="w-4 h-4 rounded cursor-pointer relative transition-colors duration-200"
                style={{
                  backgroundColor:
                    day.tasks.length > 0
                      ? getHeatmapColor(day.tasks.length)
                      : "#111827",
                }}
                onMouseEnter={() => setTooltip({ visible: true, data: day })}
                onMouseLeave={() => setTooltip({ visible: false, data: null })}
                onClick={() => setSelectedDay(day)}
              >
                {tooltip.visible && tooltip.data?.date === day.date && (
                  <div
                    className={`absolute left-6 ${
                      dayIndex > 3 ? "bottom-full mb-2" : "top-full mt-2"
                    } bg-gray-800 text-white p-2 rounded shadow-lg z-10 text-sm w-36`}
                  >
                    <div className="font-bold">{tooltip.data.date}</div>
                    <div className="mb-1">
                      Tasks: {tooltip.data.tasks.length}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen p-6 bg-black text-white">
      <div className="flex justify-between items-center mb-12">
        <h1 className="text-2xl font-bold">Streakboard</h1>
        <div className="flex gap-4">
          <p>{user.email}</p>
          <button
            className="hover:cursor-pointer"
            onClick={() => supabase.auth.signOut()}
          >
            Logout
          </button>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-lg">Loading your streak data...</div>
          </div>
        ) : (
          <>
            <div className="w-full overflow-x-auto py-4 flex justify-center">
              {renderHeatmap()}
            </div>
            {selectedDay && (
              <div className="w-full max-w-lg mt-6 text-sm bg-gray-900 p-4 rounded-lg border border-gray-700">
                <h2 className="text-lg font-semibold mb-2">
                  Tasks completed on {selectedDay.date}
                </h2>
                {selectedDay.tasks.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {selectedDay.tasks.map((task, index) => (
                      <li key={index}>{task}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400">No tasks recorded.</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
      <div className="flex justify-center mt-8">
        <div className="w-full max-w-lg flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="So, what did you do today?"
            className="flex-1 py-3 px-4 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>
    </div>
  );
}
