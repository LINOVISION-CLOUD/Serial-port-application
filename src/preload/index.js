const { contextBridge } = require("electron");
const { SerialPort } = require("serialport");

// 存储打开的串口实例（路径 -> 实例）
const openPorts = new Map();
// 存储每个串口的数据缓冲区（路径 -> 缓冲区）
const dataBuffers = new Map();
// 存储每个串口的定时器（路径 -> 定时器 ID）
const timers = new Map();
// 存储每个串口的事件监听器（路径 -> 监听器数组）
const dataListeners = new Map();

contextBridge.exposeInMainWorld("electronAPI", {
  // 获取可用串口列表
  getSerialPorts: () => SerialPort.list(),

  // 创建串口（自动处理旧端口关闭）
  createSerialPort: (path, options) => {
    return new Promise((resolve, reject) => {
      // 关闭已存在的同路径端口并移除监听器
      if (openPorts.has(path)) {
        openPorts.get(path).close();
        removeAllListeners(path);
      }
      console.log(options);

      const port = new SerialPort({ path, ...options });
      port.on("open", () => {
        openPorts.set(path, port);
        // 初始化该串口的数据缓冲区和监听器存储
        dataBuffers.set(path, Buffer.alloc(0));
        dataListeners.set(path, []);
        console.log("串口打开:", path);
        resolve();
      });
      port.on("error", (error) => {
        openPorts.delete(path);
        dataBuffers.delete(path);
        timers.delete(path);
        removeAllListeners(path);
        console.error("串口创建失败:", error);
        reject(new Error("Open failed, the target serial port is occupied"));
      });
    });
  },

  // 发送数据
  sendData: (path, data) => {
    return new Promise((resolve, reject) => {
      const port = openPorts.get(path);
      if (!port || !port.isOpen) {
        reject(new Error("Serial port is not open or invalid"));
        return;
      }

      // 添加超时控制（2 秒）
      const timeout = setTimeout(() => {
        reject(new Error("Serial port unknown exception: Timeout"));
      }, 2000);

      port.write(data, (err) => {
        clearTimeout(timeout); // 成功/失败时清除超时定时器
        if (err) {
          console.error("Data sending failed:", err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  },

  // 获取缓冲区数据
  getDataBuffer: (path) => {
    return dataBuffers.get(path) || Buffer.alloc(0);
  },

  // 清空缓冲区数据
  clearDataBuffer: (path) => {
    dataBuffers.set(path, Buffer.alloc(0));
  },

  // 绑定数据接收事件（替换旧监听器）
  onData: (path, callback) => {
    const port = openPorts.get(path);
    if (port && port.isOpen) {
      // 移除该路径上的所有旧监听器
      removeAllListeners(path);

      // 创建新监听器
      const dataListener = (chunk) => {
        const buffer = dataBuffers.get(path);
        const newBuffer = Buffer.concat([buffer, chunk]);
        dataBuffers.set(path, newBuffer);

        // 清除之前的定时器
        const prevTimer = timers.get(path);
        if (prevTimer) {
          clearTimeout(prevTimer);
        }

        // 计算一个字符传输时间（单位：毫秒）
        const baudRate = port.settings.baudRate;
        const dataBits = port.settings.dataBits;
        const stopBits = port.settings.stopBits;
        const hasParity = port.settings.parity !== "none";
        const charTime =
          (1 / baudRate) *
          1000 *
          (1 + dataBits + (hasParity ? 1 : 0) + stopBits);

        // 计算 3.5 个字符传输时间（单位：毫秒）
        const idleTime = 20 * charTime;
        // 开启新的定时器
        const newTimer = setTimeout(() => {
          const completeMessage = dataBuffers.get(path);
          callback(completeMessage);
          dataBuffers.set(path, Buffer.alloc(0));
        }, idleTime);

        timers.set(path, newTimer);
      };

      // 注册新监听器并保存引用
      port.on("data", dataListener);
      dataListeners.get(path).push(dataListener);
    } else {
      console.error("数据事件绑定失败：串口未打开", path);
    }
  },

  // 移除数据接收事件监听器
  offData: (path) => {
    removeAllListeners(path);
  },

  // 关闭串口
  closeSerialPort: (path) => {
    return new Promise((resolve, reject) => {
      const port = openPorts.get(path);
      if (!port) {
        resolve(); // 无实例直接 resolve
        return;
      }

      // 移除监听器和定时器
      removeAllListeners(path);
      const timer = timers.get(path);
      if (timer) {
        clearTimeout(timer);
        timers.delete(path);
      }

      port.close((err) => {
        if (err) reject(err);
        else {
          openPorts.delete(path);
          dataBuffers.delete(path);
          resolve();
        }
      });
    });
  },
});

// 辅助函数：移除指定路径的所有监听器
function removeAllListeners(path) {
  const port = openPorts.get(path);
  if (port && dataListeners.has(path)) {
    const listeners = dataListeners.get(path);
    listeners.forEach((listener) => {
      port.off("data", listener);
    });
    dataListeners.get(path).length = 0; // 清空数组
  }
}
