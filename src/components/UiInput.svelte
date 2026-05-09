<script>
let {
	label,
	name,
	value,
	placeholder = "",
	remove,
	error,
	touched,
	onChange,
} = $props();

let localError = $state("");

function isValidUrl(str) {
	if (!str || str.trim().length === 0) return true;
	try {
		const url = new URL(str.match(/^https?:\/\//) ? str : `https://${str}`);
		return !!url.hostname && url.hostname.includes(".");
	} catch {
		return false;
	}
}

function handleInput(e) {
	const newValue = e.target.value;
	localError = "";
	if (onChange) {
		onChange(newValue);
	}
}

function handleBlur(e) {
	const newValue = e.target.value;
	if (newValue && !isValidUrl(newValue)) {
		localError = "Please enter a valid URL";
	}
}
</script>

<div class="input-group">
    <label for={name} class="input-label">
        {label}
    </label>
    <div class="input-wrapper">
        <input
            id={name}
            {name}
            {value}
            {placeholder}
            type="text"
            aria-label={label || 'URL input'}
            aria-describedby={error && touched
                ? name + '-error'
                : name + '-help'}
            aria-invalid={!!(error && touched)}
            required
            class="text-input"
            class:error={error && touched}
            oninput={handleInput}
            onblur={handleBlur}
            onkeydown={(e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const form = e.target.form;
                    if (!form) return;
                    const inputs = Array.from(
                        form.querySelectorAll('input[type="text"]'),
                    );
                    const currentIndex = inputs.indexOf(e.target);
                    if (currentIndex < inputs.length - 1) {
                        inputs[currentIndex + 1].focus();
                    } else {
                        form.querySelector('button[type="submit"]')?.focus();
                    }
                }
            }}
        />
        <button
            type="button"
            class="remove-btn"
            onclick={remove}
            aria-label={`Remove ${label || 'URL'} input`}
            title={`Remove ${label || 'URL'} input`}
        >
            <span class="remove-icon" aria-hidden="true">×</span>
        </button>
    </div>
    {#if error && touched}
        <div
            id={name + '-error'}
            class="input-error"
            role="alert"
            aria-live="polite"
        >
            {error}
        </div>
    {:else if localError}
        <div class="input-error" role="alert" aria-live="polite">
            {localError}
        </div>
    {/if}
</div>

<style>
    .input-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
        width: 100%;
    }

    .input-label {
        font-weight: 600;
        color: #2c3e50;
        font-size: 0.875rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .input-wrapper {
        display: flex;
        align-items: center;
        gap: 8px;
        position: relative;
    }

    .text-input {
        flex: 1;
        padding: 12px 16px;
        border: 2px solid #e9ecef;
        border-radius: 8px;
        font-size: 14px;
        transition: all 0.2s ease;
        background: white;
    }

    .text-input:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    .text-input.error {
        border-color: #dc3545;
    }

    .input-error {
        font-size: 0.75rem;
        color: #dc3545;
        margin-top: 2px;
        display: flex;
        align-items: center;
        gap: 4px;
    }

    .input-error::before {
        content: '⚠';
        font-size: 0.875rem;
    }

    .remove-btn {
        padding: 8px 12px;
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 36px;
        height: 36px;
    }

    .remove-btn:hover {
        background: #c82333;
        transform: translateY(-1px);
    }

    .remove-btn:focus {
        outline: none;
        box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.25);
    }

    .remove-icon {
        font-size: 18px;
        font-weight: bold;
        line-height: 1;
    }

    @media (max-width: 768px) {
        .input-wrapper {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
        }

        .remove-btn {
            align-self: flex-end;
            min-width: 80px;
        }

        .text-input {
            padding: 14px 16px;
            font-size: 16px;
        }
    }

    @media (max-width: 480px) {
        .input-group {
            gap: 4px;
        }

        .text-input {
            padding: 12px 14px;
        }

        .remove-btn {
            min-width: 100%;
            padding: 10px;
        }
    }
</style>
