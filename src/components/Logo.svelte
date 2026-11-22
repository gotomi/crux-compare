<script>
let { size = 52 } = $props();
</script>

<!-- CrUX Compare brand mark: three sorted bars rank the compared URLs;
     bar colors follow the canonical Core Web Vitals thresholds
     (good / needs improvement / poor). Brand asset — intentionally
     theme-independent, like the favicon. -->
<svg
	viewBox="0 0 40 40"
	width={size}
	height={size}
	aria-hidden="true"
	focusable="false"
>
	<rect width="40" height="40" rx="10" fill="#1b2540"></rect>
	<rect
		x=".75"
		y=".75"
		width="38.5"
		height="38.5"
		rx="9.25"
		fill="none"
		stroke="#33426b"
		stroke-width="1.5"
	></rect>
	<rect x="9" y="9" width="22" height="5.5" rx="2.75" fill="#0cce6b"></rect>
	<rect x="9" y="17.25" width="16" height="5.5" rx="2.75" fill="#ffa400"></rect>
	<rect x="9" y="25.5" width="10" height="5.5" rx="2.75" fill="#ff6b5e"></rect>
</svg>
