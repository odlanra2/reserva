<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api/api'

const users = ref([])
const router = useRouter()

onMounted(async () => {
  const { data } = await api.get('/users')
  users.value = data
})

const handleUserClick = (user) => {
  if (user.reservas_activas >= 3) return
  router.push(`/services/${user.id}`)
}

const getInitials = (name) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase()

const AVATAR_COLORS = ['#4ecdc4', '#e85d75', '#f5a623', '#9b7ede']
</script>

<template>
  <q-page class="bg-grey-1">

    <!-- Header -->
    <div class="row justify-between items-center q-px-md q-py-sm bg-white">
      <span class="text-subtitle1 text-weight-bold">ReservasPro</span>
      <span class="text-caption text-grey-6">Selecciona un usuario</span>
    </div>
    <q-separator />

    <!-- Título -->
    <div class="text-center q-pt-xl q-pb-lg">
      <div class="text-h5 text-weight-bold q-mb-xs">¿Quién reserva hoy?</div>
      <div class="text-body2 text-grey-6">Selecciona tu perfil para continuar</div>
    </div>

    <!-- Grid de usuarios -->
    <div class="row q-col-gutter-md q-mx-auto" style="max-width: 480px; padding: 0 16px">
      <div v-for="(user, index) in users" :key="user.id" class="col-6">
        <q-card
          flat
          bordered
          class="text-center q-pa-lg usuario-card"
          :class="user.reservas_activas >= 3 ? 'usuario-card--deshabilitado' : 'cursor-pointer'"
          @click="handleUserClick(user)"
        >
          <!-- Avatar con iniciales -->
          <div
            class="q-mx-auto flex flex-center text-white text-weight-bold avatar-iniciales"
            :style="{ backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length], borderRadius:'50%'} "
          >
            {{ getInitials(user.name) }}
          </div>

          <!-- Nombre -->
          <div
            class="text-subtitle1 text-weight-bold q-mt-md"
            :class="user.reservas_activas >= 3 ? 'text-grey-5' : ''"
          >
            {{ user.name }}
          </div>

          <!-- Badge plan -->
          <div class="q-mt-sm">
            <q-badge
              rounded
              :color="user.plan === 'premium' ? 'amber-8' : 'grey-4'"
              :text-color="user.plan === 'premium' ? 'white' : 'grey-7'"
              class="q-px-sm q-py-xs"
            >
              <q-icon v-if="user.plan === 'premium'" name="diamond" size="10px" class="q-mr-xs" />
              {{ user.plan === 'premium' ? 'Premium' : 'Estándar' }}
            </q-badge>
          </div>

          <!-- Reservas o límite -->
          <div class="q-mt-sm text-caption"
            :class="user.reservas_activas >= 3 ? 'text-negative text-weight-medium' : 'text-grey-6'"
          >
            {{ user.reservas_activas >= 3 ? 'Límite alcanzado' : `${user.reservas_activas}/3 reservas` }}
          </div>
        </q-card>
      </div>
    </div>

  </q-page>
</template>

<style scoped>
.avatar-iniciales {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  font-size: 1.4rem;
}

.usuario-card {
  border-radius: 16px !important;
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}

.usuario-card:not(.usuario-card--deshabilitado):hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1) !important;
}

.usuario-card--deshabilitado {
  opacity: 0.6;
}


</style>