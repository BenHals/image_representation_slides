<template>
  <h1>{{ hello }}</h1>
</template>

<script>
export default {
  setup() {
    const hello = ref('Hello!');

    return {
      hello,
    };
  },
};
</script>
