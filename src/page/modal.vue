<template>
  <div>
    <button @click="mostrarModal = true">
      Abrir Modal
    </button>

    <q-dialog v-model="mostrarModal">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">
            Reservar servicio
          </div>
        </q-card-section>

        <q-card-section>
          ¿Deseas reservar este servicio?
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            label="Cerrar"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const mostrarModal = ref(false)
</script>