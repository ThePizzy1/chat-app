<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-950 px-4">
    <div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6">
      
      <h1 class="text-3xl font-bold text-blue-500 text-center">Register</h1>

      <div>
        <p class="text-sm text-slate-400 mb-3">Choose an avatar</p>
        <div class="grid grid-cols-5 gap-3">
          <div
            v-for="avatar in avatars"
            :key="avatar.id"
            @click="selectAvatar(avatar)"
            class="cursor-pointer rounded-xl overflow-hidden border-2 transition"
            :class="selectedAvatar?.id === avatar.id
              ? 'border-blue-500 scale-105'
              : 'border-slate-700 hover:border-blue-400'"
          >
            <img :src="avatar.url" class="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      <form @submit.prevent="register" class="space-y-4">
        <input
          v-model="displayName"
          type="text"
          placeholder="Name"
          class="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-blue-500"
        />

        <input
          v-model="email"
          type="email"
          placeholder="Email"
          class="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-blue-500"
        />

        <div class="relative">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Password"
            class="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-blue-500"
          />
          <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-3 text-sm text-slate-400">
            {{ showPassword ? 'Hide' : 'Show' }}
          </button>
          <p v-if="passwordError" class="text-red-500 text-sm mt-1">{{ passwordError }}</p>
        </div>

        <div class="relative">
          <input
            v-model="passwordVerify"
            :type="showPasswordVerify ? 'text' : 'password'"
            placeholder="Password verification"
            class="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white focus:ring-2 focus:ring-blue-500"
          />
          <button type="button" @click="showPasswordVerify = !showPasswordVerify" class="absolute right-3 top-3 text-sm text-slate-400">
            {{ showPasswordVerify ? 'Hide' : 'Show' }}
          </button>
          <p v-if="passwordVerifyError" class="text-red-500 text-sm mt-1">{{ passwordVerifyError }}</p>
        </div>

        <button
          type="submit"
          class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 transition font-semibold text-white"
        >
          Register
        </button>
      </form>

      <div class="flex items-center gap-3">
        <div class="flex-1 h-px bg-slate-700"></div>
        <span class="text-slate-500 text-sm">OR</span>
        <div class="flex-1 h-px bg-slate-700"></div>
      </div>

      <button
        @click="googleRegister"
        class="w-full py-3 rounded-xl border border-blue-500 text-blue-500 hover:bg-blue-600 hover:text-white transition"
      >
        Google register
      </button>

      <p class="text-center text-sm text-slate-500">
        Do you have an account?
        <span @click="router.push('/')" class="text-blue-500 cursor-pointer hover:underline">
          LogIn
        </span>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { auth } from '../firebase'
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { getDatabase, ref as dbRef, get, set } from "firebase/database"
import Swal from 'sweetalert2'
import { useRouter } from 'vue-router'
import { updatePassword } from "firebase/auth"

const router = useRouter()
const db = getDatabase()

const avatars = ref([])
const selectedAvatar = ref(null)
const displayName = ref('')
const email = ref('')
const password = ref('')
const passwordVerify = ref('')

const passwordError = ref('')
const passwordVerifyError = ref('')

const showPassword = ref(false)
const showPasswordVerify = ref(false)

onMounted(async () => {
  const snapshot = await get(dbRef(db, 'avatars'))
  if (snapshot.exists()) {
    avatars.value = Object.values(snapshot.val())
  }
})

const selectAvatar = (avatar) => {
  selectedAvatar.value = avatar
}

const validatePassword = (pwd) => {
 
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/
  return regex.test(pwd)
}

const register = async () => {
  passwordError.value = ''
  passwordVerifyError.value = ''

  if (!displayName.value || !email.value || !password.value || !passwordVerify.value || !selectedAvatar.value) {
    Swal.fire("Error", "Please fill in all fields and select an avatar", "warning")
    return
  }

  if (!validatePassword(password.value)) {
    passwordError.value = 'Password must have 8+ characters, uppercase, lowercase, number, and symbol.'
    return
  }

  if (password.value !== passwordVerify.value) {
    passwordVerifyError.value = 'Passwords do not match.'
    return
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value)
    const user = userCredential.user

    await set(dbRef(db, 'users/' + user.uid), {
      uid: user.uid,
      email: email.value,
      displayName: displayName.value,
      avatarId: selectedAvatar.value.id,
      avatarUrl: selectedAvatar.value.url,
      createdAt: Date.now()
    })

    Swal.fire("Success", "Account created!", "success")
    router.push('/messags')

  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      Swal.fire("Error", "A user with this email already exists.", "error")
    } else {
      Swal.fire("Error", error.message, "error")
    }
  }
}

const googleRegister = async () => {
  try {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    const user = result.user
    const snapshot = await get(dbRef(db, 'users/' + user.uid))

    if (!snapshot.exists()) {
      const randomAvatar = avatars.value[Math.floor(Math.random() * avatars.value.length)]

      await set(dbRef(db, 'users/' + user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        avatarId: randomAvatar.id,
        avatarUrl: randomAvatar.url,
        createdAt: Date.now()
      })
    }

    router.push('/messags')

  } catch (error) {
    Swal.fire("Error", error.message, "error")
  }
}
</script>