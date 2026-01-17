import { IInputs, IOutputs } from "./generated/ManifestTypes";

export class ccwisPhoneNumberFormate implements ComponentFramework.StandardControl<IInputs, IOutputs> {

    private _inputElement: HTMLInputElement;
    private _notifyOutputChanged: () => void;
    private _context: ComponentFramework.Context<IInputs>;
    private _value: string; 
    
    // Notification ID (No type annotation to satisfy ESLint)
    private _notificationId = "ccwis_phone_error"; 
    
    // Track if user is typing (No type annotation to satisfy ESLint)
    private _isEditing = false;

    // Constructor with comment
    constructor() {
        // Empty constructor
    }

    public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container: HTMLDivElement): void {
        this._context = context;
        this._notifyOutputChanged = notifyOutputChanged;

        this._inputElement = document.createElement("input");
        this._inputElement.setAttribute("type", "text");
        this._inputElement.className = "ccwis-phone-input";
        this._inputElement.placeholder = "(---) --- - ----";

        // Load initial value
        const rawValue = context.parameters.phoneNumber.raw || "";
        this._value = this.formatPhoneNumber(rawValue);
        this._inputElement.value = this._value;

        // Run validation immediately
        this.validateNumber(this._value);

        // Bind events
        this._inputElement.addEventListener("input", this.onInput.bind(this));
        this._inputElement.addEventListener("focus", this.onFocus.bind(this));
        this._inputElement.addEventListener("blur", this.onBlur.bind(this));

        container.appendChild(this._inputElement);
    }

    public updateView(context: ComponentFramework.Context<IInputs>): void {
        this._context = context;
        
        // CRITICAL: Ignore updates while the user is typing to prevent cursor jumping/clearing
        if (this._isEditing) {
            return;
        }

        const rawValue = context.parameters.phoneNumber.raw || "";
        const formattedValue = this.formatPhoneNumber(rawValue);

        if (this._value !== formattedValue) {
             this._value = formattedValue;
             this._inputElement.value = formattedValue;
             this.validateNumber(formattedValue);
        }
    }

    public getOutputs(): IOutputs {
        return {
            phoneNumber: this._value.replace(/[^0-9]/g, "")
        };
    }

    public destroy(): void {
        this._inputElement.removeEventListener("input", this.onInput.bind(this));
        this._inputElement.removeEventListener("focus", this.onFocus.bind(this));
        this._inputElement.removeEventListener("blur", this.onBlur.bind(this));
    }

    private onFocus(event: Event): void {
        this._isEditing = true;
    }

    private onBlur(event: Event): void {
        this._isEditing = false;
        // On exit, ensure formatting is perfect and re-validate
        const finalFormat = this.formatPhoneNumber(this._inputElement.value);
        this._inputElement.value = finalFormat;
        this.validateNumber(finalFormat);
    }

    private onInput(event: Event): void {
        const inputVal = this._inputElement.value;
        const formatted = this.formatPhoneNumber(inputVal);
        
        // Update input visually
        if (inputVal !== formatted) {
             this._inputElement.value = formatted;
        }

        this._value = formatted;
        
        // Validate immediately
        this.validateNumber(formatted);
        this._notifyOutputChanged();
    }

    private validateNumber(value: string): void {
        const rawDigits = value.replace(/[^0-9]/g, "");
        
        // If empty, clear errors
        if (rawDigits.length === 0) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (this._context.utils as any).clearNotification(this._notificationId);
            return;
        }

        // If less than 10 digits, SHOW ERROR
        if (rawDigits.length < 10) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (this._context.utils as any).setNotification(
                "Invalid Phone Number: Must be exactly 10 digits.", 
                this._notificationId
            );
        } 
        else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (this._context.utils as any).clearNotification(this._notificationId);
        }
    }

    private formatPhoneNumber(value: string): string {
        if (!value) return "";
        const phoneNumber = value.replace(/[^\d]/g, "");
        const len = phoneNumber.length;

        if (len === 0) return "";
        if (len < 4) return phoneNumber;
        if (len < 7) return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
        
        return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    }
}