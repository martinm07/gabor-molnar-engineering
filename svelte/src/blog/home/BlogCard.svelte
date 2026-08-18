<script module lang="ts">
  export interface IBlogCard {
    recalculateBumps(): void;
  }
</script>

<script lang="ts">
  interface Props {
    title: string;
    description: string;
    tags: string[];
    accent: string;
    svgIcon: string;
  }
</script>
