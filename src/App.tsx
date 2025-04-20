import { useEffect, useRef, useState } from "react";

type ContributionDay = {
  date: string;
  tasks: string[];
};

type StreakData = ContributionDay[];

function App() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [streakData, setStreakData] = useState<StreakData>([]);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    data: ContributionDay | null;
  }>({
    visible: false,
    data: null,
  });

  useEffect(() => {
    inputRef.current?.focus();
    generateStreakData();
  }, []);

  const getHeatmapColor = (count: number) => {
    const greenIntensity = Math.min(count * 40, 255);
    return `rgb(0, ${greenIntensity}, 0)`;
  };

  const generateStreakData = () => {
    const daysInYear = 365;
    const generatedData: StreakData = [];

    for (let i = 0; i < daysInYear; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const formattedDate = date.toISOString().split("T")[0];

      generatedData.push({
        date: formattedDate,
        tasks: ["did something", "did something"],
      });
    }

    setStreakData(generatedData);
  };

  const handleMouseEnter = (day: ContributionDay) => {
    setTooltip({
      visible: true,
      data: day,
    });
  };

  const handleMouseLeave = () => {
    setTooltip({
      visible: false,
      data: null,
    });
  };

  return (
    <div className="flex flex-col min-h-screen p-6">
      <div className="flex-1">
        <div className="grid grid-flow-col justify-center auto-cols-max gap-1 p-3 relative">
          {Array.from({ length: 52 }).map((_, weekIndex) => (
            <div key={weekIndex} className="grid grid-rows-7 gap-1">
              {streakData
                .slice(weekIndex * 7, (weekIndex + 1) * 7)
                .map((day, dayIndex) => (
                  <div
                    key={`${weekIndex}-${dayIndex}`}
                    className="w-5 h-5 rounded-lg relative"
                    style={{
                      backgroundColor:
                        day.tasks.length > 0
                          ? getHeatmapColor(day.tasks.length)
                          : "#292828",
                    }}
                    onMouseEnter={() => handleMouseEnter(day)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {tooltip.visible && tooltip.data === day && (
                      <div
                        className="absolute left-6 bg-black opacity-80 text-white p-2 rounded-md shadow-md w-32"
                        style={{ zIndex: 10 }}
                      >
                        <div>{day.date}</div>
                        <div>Tasks Done: {day.tasks.length}</div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>

      <div></div>

      <div className="flex justify-center text-white">
        <input
          type="text"
          ref={inputRef}
          placeholder="So, What did you do today?"
          className="w-[50%] text-base py-2 px-3 rounded-lg bg-[#1e1e1e] border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 font-inter"
        />
      </div>
    </div>
  );
}

export default App;
