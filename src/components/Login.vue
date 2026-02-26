<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-950 px-4">

    <div
      class="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6"
    >
      <div class="text-center space-y-2">
        <h1 class="text-3xl font-bold text-blue-500">LogIn</h1>
        <p class="text-slate-400 text-sm">Welcome back 👋</p>
      </div>


      <form @submit.prevent="login" class="space-y-5">
        <div class="space-y-2">
          <label class="text-sm text-slate-400">Email</label>
          <input
            v-model="email"
            type="email"
            placeholder="unesi@email.com"
            class="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        <div class="space-y-2">
          <label class="text-sm text-slate-400">Password</label>
          <input
            v-model="password"
            type="password"
            placeholder="••••••••"
            class="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        <button
          type="submit"
          class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 transition font-semibold text-white shadow-lg shadow-blue-600/30"
        >
          Login
        </button>
      </form>


      <div class="flex items-center gap-3">
        <div class="flex-1 h-px bg-slate-700"></div>
        <span class="text-slate-500 text-sm">OR</span>
        <div class="flex-1 h-px bg-slate-700"></div>
      </div>

   
      <button
        @click="googleLogin"
        class="w-full py-3 rounded-xl border border-blue-500 text-blue-500 hover:bg-blue-600 hover:text-white transition font-semibold"
      >
        Continue with Google
      </button>
      <p class="text-center text-sm text-slate-500">
 Don't have an account?
  <span
    @click="router.push('/register')"
    class="text-blue-500 cursor-pointer hover:underline"
  >
    Register
  </span>
</p>
    </div>
    
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { auth } from '../firebase'
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged
} from "firebase/auth"
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'

const email = ref('')
const password = ref('')
const router = useRouter()

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) router.push('/messags')
  })
})

const login = async () => {
  if (!email.value || !password.value) {
    Swal.fire({
      icon: 'warning',
      title: 'Nedostaju podaci',
      text: 'Unesi email i lozinku'
    })
    return
  }

  try {
    await signInWithEmailAndPassword(auth, email.value, password.value)
    Swal.fire({
      icon: 'success',
      title: 'Uspješna prijava!',
      timer: 1500,
      showConfirmButton: false
    })
    router.push('/messags')
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Greška',
      text: error.message
    })
  }
}

const googleLogin = async () => {
  try {
    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
    Swal.fire({
      icon: 'success',
      title: 'Google prijava uspješna!',
      timer: 1500,
      showConfirmButton: false
    })
    router.push('/messags')
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Google prijava neuspješna',
      text: error.message
    })
  }
}
</script>