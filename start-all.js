const { spawn } = require("child_process");

// 启动前端进程
const frontend = spawn("yarn", ["start"], {
  cwd: "./frontend", // 切换到前端目录
  stdio: "inherit", // 继承终端输出
  shell: true,
});

// 启动后端进程
const backend = spawn("yarn", ["dev"], {
  cwd: "./backend", // 切换到后端目录
  stdio: "inherit",
  shell: true,
});

// 监听进程退出信号，确保两个进程一起退出
const cleanup = () => {
  console.log("\n🛑 Stopping all services...");

  frontend.kill("SIGTERM"); // 终止前端
  backend.kill("SIGTERM"); // 终止后端

  process.exit();
};

// 捕获 `Ctrl + C` 退出信号
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);