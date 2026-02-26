<template>
  <div class="min-h-screen bg-slate-950 text-white flex">


    <div class="w-full md:w-1/3 border-r border-slate-800 flex flex-col">

      <div class="p-4 border-b border-slate-800 flex items-center gap-3">
        <img :src="currentUserData?.avatarUrl" class="w-12 h-12 rounded-xl" />
        <div class="flex-1">
          <div class="font-semibold">{{ currentUserData?.displayName }}</div>
          <div class="text-xs text-slate-400">{{ currentUser?.email }}</div>
        </div>
        <button class="btn btn-sm btn-outline btn-info" @click="updateName">Edit</button>
      </div>


      <ul class="flex-1 overflow-y-auto">
        <li v-for="user in otherUsers"
            :key="user.uid"
            @click="selectUser(user)"
            class="p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-800 transition border-b border-slate-800">
          <img :src="user.avatarUrl" class="w-10 h-10 rounded-xl" />
          <div>
            <div class="font-medium">{{ user.displayName }}</div>
            <div class="text-xs text-slate-400">{{ user.email }}</div>
          </div>
        </li>
      </ul>


      <div class="p-4 border-t border-slate-800">
        <button @click="logout" class="btn btn-error w-full">Logout</button>
      </div>
    </div>


    <div class="flex-1 flex flex-col">


      <div v-if="selectedUser"
           class="p-4 border-b border-slate-800 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <img :src="selectedUser.avatarUrl" class="w-12 h-12 rounded-xl" />
          <span class="font-semibold">
            Chat with: {{ selectedUser.displayName }}
          </span>
        </div>
        <button @click="toggleGraph"
                class="btn btn-sm btn-outline btn-accent">
          📊
        </button>
      </div>


      <div class="flex-1 p-4 overflow-y-auto relative">
        <div v-for="msg in messages"
             :key="msg.timestamp"
             class="mb-3"
             :class="msg.senderId === currentUser.uid ? 'text-right' : 'text-left'">
          <div class="inline-block px-4 py-2 rounded-xl"
               :class="msg.senderId === currentUser.uid ? 'bg-blue-600' : 'bg-slate-800'">
            {{ msg.text }}
          </div>
        </div>

        
        <div v-if="showGraph"
             class="absolute top-0 left-1/2 transform -translate-x-1/2
                    bg-slate-900 p-6 rounded-xl border border-slate-700
                    w-96 z-10 shadow-lg"
             style="height: 250px;">
          <h3 class="text-center font-semibold mb-2">
            Messages per Hour
          </h3>
          <canvas class="p-4" ref="chartCanvas"></canvas>
        </div>
      </div>

 
      <div v-if="selectedUser"
           class="p-4 border-t border-slate-800 flex gap-3">
        <input v-model="newMessage"
               class="flex-1 px-4 py-2 rounded-xl bg-slate-800"
               placeholder="Message..." />
        <button @click="sendMessage"
                class="btn btn-info">
          Send
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { auth } from '../firebase'
import { signOut } from "firebase/auth"
import { getDatabase, ref as dbRef, get, set, push, onValue } from "firebase/database"
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend
)

const db = getDatabase()

const currentUser = auth.currentUser
const currentUserData = ref(null)
const users = ref({})
const selectedUser = ref(null)
const messages = ref([])
const newMessage = ref('')
const showGraph = ref(false)

const chartCanvas = ref(null)
let chartInstance = null


onMounted(async () => {
  const snapshot = await get(dbRef(db, 'users'))
  users.value = snapshot.val()
  currentUserData.value = users.value[currentUser.uid]
})

const otherUsers = computed(() => {
  if (!users.value) return []
  return Object.values(users.value)
    .filter(u => u.uid !== currentUser.uid)
})

const logout = async () => {
  await signOut(auth)
  window.location.href = "/"
}

const selectUser = (user) => {
  selectedUser.value = user
  loadMessages(user.uid)
}

const loadMessages = (otherUid) => {
  const conversationId =
    [currentUser.uid, otherUid].sort().join('_')

  onValue(dbRef(db, 'messages/' + conversationId), async (snapshot) => {
    const data = snapshot.val()
    messages.value = data ? Object.values(data) : []
    if (showGraph.value) {
      await nextTick()
      buildChart()
    }
  })
}

const sendMessage = async () => {
  if (!newMessage.value) return

  const conversationId =
    [currentUser.uid, selectedUser.value.uid].sort().join('_')

  await push(dbRef(db, 'messages/' + conversationId), {
    senderId: currentUser.uid,
    receiverId: selectedUser.value.uid,
    text: newMessage.value,
    timestamp: Date.now(),
    seen: false
  })

  newMessage.value = ''
}

const updateName = async () => {
  const newName = prompt("Novo ime:")
  if (!newName) return

  await set(
    dbRef(db, 'users/' + currentUser.uid + '/displayName'),
    newName
  )

  currentUserData.value.displayName = newName
}

const toggleGraph = async () => {
  showGraph.value = !showGraph.value
  if (showGraph.value) {
    await nextTick()
    buildChart()
  }
}

const buildChart = () => {
  if (!chartCanvas.value) return

  const hours =
    Array.from({ length: 24 }, (_, i) => `${i}:00`)

  const counts = Array(24).fill(0)

  messages.value.forEach(msg => {
    if (msg.timestamp) {
      const date = new Date(msg.timestamp)
      counts[date.getHours()]++
    }
  })

  if (chartInstance) {
    chartInstance.destroy()
  }

  chartInstance = new Chart(chartCanvas.value, {
    type: 'bar',
    data: {
      labels: hours,
      datasets: [{
        label: 'Messages',
        data: counts,
        backgroundColor: '#3B82F6',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { ticks: { color: '#ddd' } },
        y: { beginAtZero: true, ticks: { color: '#ddd' } }
      }
    }
  })
}

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.destroy()
  }
})
</script>