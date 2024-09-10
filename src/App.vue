<script setup>
// import Comment from './components/comment.vue'
import { reactive } from 'vue';
let data = reactive({
  name: 'lp',
})
const addAttr = () => {
  // console.log(data);
  data = {
    newBranch: 'newBranch'
  }
  Object.assign(data, {
    name: 20,
    age: 20
  })
}
</script>

<template>
  <!-- <Comment /> -->
  {{ data }}
  <button @click="addAttr">addAttr</button>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
