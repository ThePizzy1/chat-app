<template>
  <div class="min-h-screen bg-slate-950 text-white flex">

    <div class="w-full md:w-1/3 border-r border-slate-800 flex flex-col">

  <div class="p-4 border-b border-slate-800 flex items-center gap-3">
    <img :src="currentUserData?.avatarUrl" class="w-12 h-12 rounded-xl" />
    <div class="flex-1">
      <div class="font-semibold">{{ currentUserData?.displayName }}</div>
      <div class="text-xs text-slate-400">{{ currentUser?.email }}</div>
    </div>
    <button class="btn btn-sm btn-outline btn-info" @click="updateName">
      Edit
    </button>
  </div>

  <ul class="flex-1 overflow-y-auto">
    <li
      v-for="user in otherUsers"
      :key="user.uid"
      @click="selectUser(user)"
      class="p-4 flex items-center gap-3 cursor-pointer hover:bg-slate-800 transition border-b border-slate-800"
    >
      <img :src="user.avatarUrl" class="w-10 h-10 rounded-xl" />
      <div>
        <div class="font-medium">{{ user.displayName }}</div>
        <div class="text-xs text-slate-400">{{ user.email }}</div>
      </div>
    </li>
  </ul>


  <div class="p-4 border-t border-slate-800">
    <button
      @click="logout"
      class="btn btn-error w-full"
    >
      Logout
    </button>
  </div>

</div>
    <div class="flex-1 flex flex-col">

      <div
        v-if="selectedUser"
        class="p-4 border-b border-slate-800 font-semibold"
      >
        Chat sa: {{ selectedUser.displayName }}
      </div>

      <div class="flex-1 p-4 overflow-y-auto">
        <div
          v-for="msg in messages"
          :key="msg.timestamp"
          class="mb-3"
          :class="msg.senderId === currentUser.uid ? 'text-right' : 'text-left'"
        >
          <div
            class="inline-block px-4 py-2 rounded-xl"
            :class="msg.senderId === currentUser.uid
              ? 'bg-blue-600'
              : 'bg-slate-800'"
          >
            {{ msg.text }}
          </div>
        </div>
      </div>

      <div
        v-if="selectedUser"
        class="p-4 border-t border-slate-800 flex gap-3"
      >
        <input
          v-model="newMessage"
          class="flex-1 px-4 py-2 rounded-xl bg-slate-800"
          placeholder="Upiši poruku..."
        />
        <button
          @click="sendMessage"
          class="btn btn-info"
        >
          Pošalji
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { auth } from '../firebase'
import { signOut } from "firebase/auth"
import { getDatabase, ref as dbRef, get, set, push, onValue } from "firebase/database"

const db = getDatabase()

const currentUser = auth.currentUser
const currentUserData = ref(null)

const users = ref({})
const selectedUser = ref(null)
const messages = ref([])
const newMessage = ref('')



onMounted(async () => {
  const snapshot = await get(dbRef(db, 'users'))
  users.value = snapshot.val()

  currentUserData.value = users.value[currentUser.uid]
})
const logout = async () => {
  try {
    await signOut(auth)
    window.location.href = "/"
  } catch (error) {
    console.error("Logout failed:", error)
  }
}

const otherUsers = computed(() => {
  if (!currentUser || !users.value) return []
  return Object.values(users.value).filter(
    u => u.uid !== currentUser.uid
  )
})


const selectUser = (user) => {
  selectedUser.value = user
  loadMessages(user.uid)
}


const loadMessages = (otherUid) => {
  const conversationId = [currentUser.uid, otherUid].sort().join('_')

  onValue(dbRef(db, 'messages/' + conversationId), (snapshot) => {
    const data = snapshot.val()
    messages.value = data ? Object.values(data) : []
  })
}

const sendMessage = async () => {
  if (!newMessage.value) return

  const conversationId = [currentUser.uid, selectedUser.value.uid].sort().join('_')

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

  await set(dbRef(db, 'users/' + currentUser.uid + '/displayName'), newName)
  currentUserData.value.displayName = newName
}
</script>