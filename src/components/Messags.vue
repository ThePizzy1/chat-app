<template>
  <div class="min-h-screen bg-slate-950 text-white flex relative">


    <div v-if="mobileDrawer"
         class="fixed inset-0 bg-black/60 z-40 md:hidden"
         @click="mobileDrawer = false"></div>


    <div
      class="fixed md:relative z-50 md:z-auto
             w-72 md:w-1/3 h-full
             bg-slate-950 border-r border-slate-800
             transform transition-transform duration-300
             md:translate-x-0"
      :class="mobileDrawer ? 'translate-x-0' : '-translate-x-full md:translate-x-0'"
    >


      <div class="p-4 border-b border-slate-800 flex items-center gap-3">
        <img :src="currentUserData?.avatarUrl" class="w-12 h-12 rounded-xl" />
        <div class="flex-1">
          <div class="font-semibold">{{ currentUserData?.displayName }}</div>
          <div class="text-xs text-slate-400">{{ currentUser?.email }}</div>
        </div>
        <button class="btn btn-xs btn-outline btn-info" @click="openEdit">
          Edit
        </button>
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


    <div class="flex-1 flex flex-col w-full">


      <div class="p-4 border-b border-slate-800 flex items-center justify-between">

        <div class="flex items-center gap-3">

          <button class="md:hidden btn btn-sm btn-outline"
                  @click="mobileDrawer = true">
            ☰
          </button>


          <button v-if="selectedUser"
                  class="md:hidden btn btn-sm btn-outline"
                  @click="selectedUser = null">
            ←
          </button>

          <div v-if="selectedUser" class="flex items-center gap-3">
            <img :src="selectedUser.avatarUrl" class="w-10 h-10 rounded-xl" />
            <span class="font-semibold">
              {{ selectedUser.displayName }}
            </span>
          </div>

          <div v-else class="text-slate-400">
            Select a conversation
          </div>
        </div>

        <button v-if="selectedUser"
                @click="toggleGraph"
                class="btn btn-sm btn-outline btn-accent">
          📊
        </button>
      </div>


      <div class="flex-1 p-4 overflow-y-auto relative">

        <div v-if="!selectedUser"
             class="h-full flex items-center justify-center text-slate-500">
          Open a chat to start messaging
        </div>

        <div v-for="msg in messages"
             v-else
             :key="msg.timestamp"
             class="mb-3"
             :class="msg.senderId === currentUser.uid ? 'text-right' : 'text-left'">

          <div class="inline-block px-4 py-2 rounded-xl max-w-[75%]"
               :class="msg.senderId === currentUser.uid
                  ? 'bg-blue-600'
                  : 'bg-slate-800'">
            {{ msg.text }}
          </div>
        </div>


        <div v-if="showGraph"
             class="absolute top-4 left-1/2 transform -translate-x-1/2
                    bg-slate-900 p-6 rounded-xl border border-slate-700
                    w-80 md:w-96 z-30 shadow-lg"
             style="height: 250px;">
          <h3 class="text-center font-semibold mb-2">
            Messages per Hour
          </h3>
          <canvas ref="chartCanvas"></canvas>
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

<div v-if="showEdit"
     class="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]">

  <div class="bg-slate-900 p-6 rounded-2xl w-96 max-w-[90%]
              space-y-4 border border-slate-700">

    <h2 class="text-xl font-bold text-center">Edit Profile</h2>

    
    <input v-model="editName"
           type="text"
           placeholder="New name"
           class="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700" />


    <input v-model="newPassword"
           type="password"
           placeholder="New password"
           class="w-full px-4 py-2 rounded-xl bg-slate-800 border border-slate-700" />


    <p class="text-sm text-slate-400">Change avatar</p>
    <div class="grid grid-cols-5 gap-2">
      <div v-for="avatar in avatars"
           :key="avatar.id"
           @click="selectedNewAvatar = avatar"
           class="cursor-pointer rounded-xl overflow-hidden border-2 transition"
           :class="selectedNewAvatar?.id === avatar.id
              ? 'border-blue-500 scale-105'
              : 'border-slate-700'">
        <img :src="avatar.url" class="w-full h-full object-cover" />
      </div>
    </div>

    <div class="flex gap-3 pt-2">
      <button @click="saveChanges"
              class="btn btn-success flex-1">
        Save
      </button>
      <button @click="showEdit = false"
              class="btn btn-error flex-1">
        Cancel
      </button>
    </div>

  </div>
</div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { auth } from '../firebase'
import { signOut, updatePassword, onAuthStateChanged } from "firebase/auth"
import { getDatabase, ref as dbRef, get, set, push, onValue, off } from "firebase/database"
import Swal from "sweetalert2"
import Chart from 'chart.js/auto'

const db = getDatabase()


const mobileDrawer = ref(false)

const currentUser = ref(null)
const currentUserData = ref(null)

const users = ref({})
const selectedUser = ref(null)
const messages = ref([])
const newMessage = ref('')
const showGraph = ref(false)

const showEdit = ref(false)
const editName = ref('')
const newPassword = ref('')
const avatars = ref([])
const selectedNewAvatar = ref(null)

const chartCanvas = ref(null)
let chartInstance = null
let messagesRef = null
let previousMessageCount = 0

const messageSound = new Audio('/notification.mp3')//C:\Users\Korisnik\Documents\Message\chat-app\src\notification.mp3
messageSound.volume = 0.7

onMounted(() => {

  onAuthStateChanged(auth, async (user) => {

    if (!user) {
      window.location.href = "/"
      return
    }

    currentUser.value = user

    const snapshot = await get(dbRef(db, 'users'))
    users.value = snapshot.val() || {}
    currentUserData.value = users.value[user.uid]

    const avatarSnap = await get(dbRef(db, 'avatars'))
    if (avatarSnap.exists()) {
      avatars.value = Object.values(avatarSnap.val())
    }

  })

})


const otherUsers = computed(() =>
  Object.values(users.value || {})
    .filter(u => u.uid !== currentUser.value?.uid)
)


const selectUser = (user) => {
  selectedUser.value = user
  mobileDrawer.value = false
  loadMessages(user.uid)
}

const loadMessages = (otherUid) => {

  if (!currentUser.value) return

  const conversationId =
    [currentUser.value.uid, otherUid].sort().join('_')

  if (messagesRef) off(messagesRef)

  messagesRef = dbRef(db, 'messages/' + conversationId)

onValue(messagesRef, async (snapshot) => {
  const data = snapshot.val()
  const newMessages = data ? Object.values(data) : []


  if (
    newMessages.length > previousMessageCount &&
    previousMessageCount !== 0
  ) {
    const lastMessage = newMessages[newMessages.length - 1]


    if (lastMessage.senderId !== currentUser.value.uid) {
      messageSound.play()
    }
  }

  previousMessageCount = newMessages.length
  messages.value = newMessages

  if (showGraph.value) {
    await nextTick()
    buildChart()
  }
})
}

const sendMessage = async () => {
  if (!newMessage.value || !selectedUser.value) return

  const conversationId =
    [currentUser.value.uid, selectedUser.value.uid].sort().join('_')

  await push(dbRef(db, 'messages/' + conversationId), {
    senderId: currentUser.value.uid,
    receiverId: selectedUser.value.uid,
    text: newMessage.value,
    timestamp: Date.now(),
    seen: false
  })

  newMessage.value = ''
}


const openEdit = () => {
  editName.value = currentUserData.value.displayName
  selectedNewAvatar.value = {
    id: currentUserData.value.avatarId,
    url: currentUserData.value.avatarUrl
  }
  showEdit.value = true
}

const saveChanges = async () => {
  try {

    if (editName.value !== currentUserData.value.displayName) {
      await set(
        dbRef(db, 'users/' + currentUser.value.uid + '/displayName'),
        editName.value
      )
      currentUserData.value.displayName = editName.value
    }

    if (selectedNewAvatar.value &&
        selectedNewAvatar.value.id !== currentUserData.value.avatarId) {

      await set(
        dbRef(db, 'users/' + currentUser.value.uid + '/avatarId'),
        selectedNewAvatar.value.id
      )

      await set(
        dbRef(db, 'users/' + currentUser.value.uid + '/avatarUrl'),
        selectedNewAvatar.value.url
      )

      currentUserData.value.avatarUrl = selectedNewAvatar.value.url
      currentUserData.value.avatarId = selectedNewAvatar.value.id
    }

    if (newPassword.value) {
      await updatePassword(currentUser.value, newPassword.value)
    }
    Swal.fire("Success", "Profile updated!", "success")
    showEdit.value = false

  } catch (error) {
    Swal.fire("Error", error.message, "error")
  }
}
const logout = async () => {
  await signOut(auth)
  window.location.href = "/"
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

  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`)
  const counts = Array(24).fill(0)

  messages.value.forEach(msg => {
    if (msg.timestamp) {
      counts[new Date(msg.timestamp).getHours()]++
    }
  })

  if (chartInstance) chartInstance.destroy()

  chartInstance = new Chart(chartCanvas.value, {
    type: 'bar',
    data: {
      labels: hours,
      datasets: [{
        data: counts,
        backgroundColor: '#3B82F6',
        borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } }
    }
  })
}

onBeforeUnmount(() => {
  if (chartInstance) chartInstance.destroy()
  if (messagesRef) off(messagesRef)
})
</script>