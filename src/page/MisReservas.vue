<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api/api'

interface Service {
  name: string
  duration: number
  price: number
  category?: string
}

interface Reservation {
  id: number
  service: Service
  fecha_inicio: string
  estado: string
}

type TabKey = 'Activas' | 'Historial'

const route = useRoute()
const router = useRouter()
const userId = route.params.userId as string

const reservas = ref<Reservation[]>([])
const tab = ref<TabKey>('Activas')

// Cargar reservas
onMounted(async () => {
  const { data } = await api.get<Reservation[]>('/reservations/filter', {
    params: {
      user_id: userId,
      from: '2026-01-01',
      to: '2026-12-31',
    },
  })
  reservas.value = data
})

const cancelarReserva = async (id: number) => {
  try {
    const res = await api.post(`/reservations/${id}/cancel`)
    alert(res.data.message + ' - Reembolso: ' + res.data.reembolso)
    reservas.value = reservas.value.map(r =>
      r.id === id ? { ...r, estado: 'cancelled' } : r
    )
  } catch (err: any) {
    alert('Error al cancelar: ' + err.message)
  }
}

const activasCount = () => reservas.value.filter(r => r.estado === 'active').length
const canceladasCount = () => reservas.value.filter(r => r.estado === 'cancelled').length
const disponiblesCount = () => reservas.value.filter(r => r.estado === 'available').length

const filtradas = () =>
  reservas.value.filter(r =>
    tab.value === 'Activas' ? r.estado === 'active' : r.estado === 'cancelled'
  )

const goToServices = () => router.push(`/services/${userId}`)

// Helpers
const formatPrice = (price: number) => `$ ${price.toLocaleString('es-CO')}`
const getStatusLabel = (estado: string) =>
  estado === 'active' ? 'Activa' : estado === 'cancelled' ? 'Cancelada' : 'Disponible'
const getDaysUntil = (fechaInicio: string) => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(fechaInicio)
  target.setHours(0, 0, 0, 0)
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'En 1 día'
  if (diff < 0) return 'Pasada'
  return `En ${diff} días`
}
</script>

<template>
  <q-page padding>
    <!-- Header -->
    <div class="row items-center justify-between q-mb-md">
      <div class="row items-center">
        <q-btn flat round icon="arrow_back" @click="goToServices" />
        <h5 class="q-ml-sm">Mis reservas</h5>
      </div>
      <q-btn label="+ Nueva" color="primary" @click="goToServices" />
    </div>
    <q-separator />

    <!-- Stats -->
    <div class="row q-my-md text-center">
      <div class="col">
        <div class="text-h6 text-positive">{{ activasCount() }}</div>
        <div class="text-caption">Activas</div>
      </div>
      <div class="col">
        <div class="text-h6 text-grey">{{ canceladasCount() }}</div>
        <div class="text-caption">Canceladas</div>
      </div>
      <div class="col">
        <div class="text-h6 text-grey">{{ disponiblesCount() }}</div>
        <div class="text-caption">Disponibles</div>
      </div>
    </div>

    <!-- Tabs -->
    <q-tabs v-model="tab" class="text-primary q-mb-md">
      <q-tab name="Activas" label="Activas" />
      <q-tab name="Historial" label="Historial" />
    </q-tabs>

    <!-- Lista de reservas -->
    <div v-if="filtradas().length === 0" class="text-center text-grey q-mt-lg">
      {{ tab === 'Activas' ? 'No tienes reservas activas.' : 'No hay reservas en el historial.' }}
    </div>

    <div v-else class="column q-gutter-md">
      <q-card
        v-for="r in filtradas()"
        :key="r.id"
        class="shadow-2"
        :class="r.estado === 'active' ? 'bg-green-1' : 'bg-red-1'"
      >
        <q-card-section>
          <div class="row items-center justify-between">
            <div>
              <div class="text-h6">{{ r.service.name }}</div>
              <div class="text-caption">
                📅 {{ new Date(r.fecha_inicio).toLocaleDateString('es-CO',{weekday:'short',day:'numeric',month:'short'}) }}
                · 🕐 {{ new Date(r.fecha_inicio).toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'}) }}
                · ⏱ {{ r.service.duration }} min
              </div>
            </div>
            <q-badge :color="r.estado === 'active' ? 'positive' : 'negative'">
              {{ getStatusLabel(r.estado) }}
            </q-badge>
          </div>
        </q-card-section>

        <q-card-section class="row items-center justify-between">
          <div class="text-bold text-primary">{{ formatPrice(r.service.price) }}</div>
          <div v-if="r.estado === 'active'" class="text-caption text-grey">
            Reembolso 100% si cancelas
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions v-if="r.estado === 'active'" align="between">
          <span class="text-caption">{{ getDaysUntil(r.fecha_inicio) }}</span>
          <q-btn
            label="Cancelar →"
            color="negative"
            size="sm"
            @click="cancelarReserva(r.id)"
          />
        </q-card-actions>
      </q-card>
    </div>
  </q-page>
</template>
