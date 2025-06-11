<template>
  <el-dialog
    v-model="dialogShow"
    title="Set slaveAddress"
    width="80%"
    top="5vh"
  >
    <el-card v-for="(item, index) in deviceWrite" :key="index">
      <div
        style="margin-bottom: 15px"
        v-if="
          deviceTypes[selectedDeviceType].name ==
            'Solar-CMP10A/POE-804G-Solar' && item[0].value != undefined
        "
      >
        <el-button @click="writeConfig(item, 1)">12V LiFePO (4S)</el-button>
        <el-button @click="writeConfig(item, 2)">24V LiFePO (8S)</el-button>
        <el-button @click="writeConfig(item, 3)">12V NMC (3S)</el-button>
        <el-button @click="writeConfig(item, 4)">24V NMC (7S)</el-button>
      </div>
      <el-row :gutter="20">
        <el-col
          :span="12"
          v-for="item1 in item"
          v-show="item1.show"
          :key="item1.name"
        >
          <div
            style="
              display: flex;
              margin-bottom: 20px;
              align-items: center;
              gap: 15px;
            "
          >
            <span
              style="white-space: nowrap; min-width: 270px; text-align: right"
              >{{ item1.name }}:</span
            >
            <el-select v-if="item1.interval" v-model="item1.value" filterable>
              <el-option
                v-for="item2 in item1.interval"
                :label="item2.label"
                :value="item2.value"
                :key="item2.value"
              >
              </el-option>
            </el-select>
            <el-input v-model="item1.value" v-else></el-input>
          </div>
        </el-col>
      </el-row>
      <div style="display: flex; justify-content: center">
        <el-button
          type="success"
          @click="writeConfig(item)"
          style="margin: auto"
          :loading="writeLoading"
        >
          Write
        </el-button>
      </div>
    </el-card>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogShow = false">Cancel</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, toRefs } from "vue";
import { useDeviceStore } from "../stores/deviceStore.js";
import { ElMessage } from "element-plus";
import { fa } from "element-plus/es/locales.mjs";
const deviceStore = useDeviceStore();
const { selectedDeviceType, deviceTypes } = toRefs(deviceStore);
const deviceWrite = ref([]);
const form = ref({});
const dialogShow = ref(false);
const writeLoading = ref(false);
const writeConfig = async (detail, flag) => {
  try {
    console.log(
      deviceTypes.value[selectedDeviceType.value].name ==
        "Solar-CMP10A/POE-804G-Solar"
    );
    writeLoading.value = true;
    let writeDetail = detail;
    console.log(selectedDeviceType);
    switch (flag) {
      case 1:
        writeDetail.forEach((o) => {
          if (o.check == "31") {
            o.value = 1;
          }
          if (o.check == "32") {
            o.value = 14.4;
          }
          if (o.check == "33") {
            o.value = 10;
          }
          if (o.check == "34") {
            o.value = 0.5;
          }
          if (o.check == "20") {
            o.value = 11.2;
          }
          if (o.check == "21") {
            o.value = 12.3;
          }
          if (o.check == "19") {
            o.value = 15;
          }
          if (o.check == "23") {
            o.value = 14.2;
          }
          if (o.check == "22") {
            o.value = 14.4;
          }
        });
        break;
      case 2:
        writeDetail.forEach((o) => {
          if (o.check == "31") {
            o.value = 2;
          }
          if (o.check == "32") {
            o.value = 28.8;
          }
          if (o.check == "33") {
            o.value = 10;
          }
          if (o.check == "34") {
            o.value = 0.5;
          }
          if (o.check == "20") {
            o.value = 22.4;
          }
          if (o.check == "21") {
            o.value = 24.6;
          }
          if (o.check == "19") {
            o.value = 30;
          }
          if (o.check == "23") {
            o.value = 28.4;
          }
          if (o.check == "22") {
            o.value = 28.8;
          }
        });
        break;
      case 3:
        writeDetail.forEach((o) => {
          if (o.check == "31") {
            o.value = 1;
          }
          if (o.check == "32") {
            o.value = 12.6;
          }
          if (o.check == "33") {
            o.value = 10;
          }
          if (o.check == "34") {
            o.value = 0.5;
          }
          if (o.check == "20") {
            o.value = 9;
          }
          if (o.check == "21") {
            o.value = 9.9;
          }
          if (o.check == "19") {
            o.value = 13;
          }
          if (o.check == "23") {
            o.value = 12.3;
          }
          if (o.check == "22") {
            o.value = 12.6;
          }
        });
        break;
      case 4:
        writeDetail.forEach((o) => {
          if (o.check == "31") {
            o.value = 2;
          }
          if (o.check == "32") {
            o.value = 29.4;
          }
          if (o.check == "33") {
            o.value = 10;
          }
          if (o.check == "34") {
            o.value = 0.5;
          }
          if (o.check == "20") {
            o.value = 21;
          }
          if (o.check == "21") {
            o.value = 22.2;
          }
          if (o.check == "19") {
            o.value = 30.8;
          }
          if (o.check == "23") {
            o.value = 28.7;
          }
          if (o.check == "22") {
            o.value = 29.4;
          }
        });
        break;
    }
    console.log(writeDetail);
    await deviceStore.sendConfigCommand(writeDetail);
    if (deviceStore.configStatus) {
      writeLoading.value = false;
      deviceStore.slaveAddress = form.value.slaveAddress;
      dialogShow.value = false;
      ElMessage.success(`Configuration written successfully`);
    } else {
      writeLoading.value = false;
      ElMessage.error("Configuration write failed");
    }
  } catch (error) {
    // 处理超时或其他错误
    writeLoading.value = false;
    ElMessage.error(error.message);
  }
};

const show = () => {
  dialogShow.value = true;
  deviceWrite.value = deviceStore.operates;
};
defineExpose({
  show,
});
</script>
<style scoped lang="scss">
:deep(.el-select__input) {
  margin: 0 !important;
}
</style>
