/**
 * pxt-lora block
 */
//% weight=100 color=#00cc00 icon="\uf012" block="E32LORA"
namespace pxtlora {

//    const E32LORA_I2C_ADDR=0x68


    function E32LORA_init() {
    }

    /**
     * E32 Pin Config class
     */
    export class E32PinConfig {
        m0: DigitalPin;
        m1: DigitalPin;
        aux: DigitalPin;
        tx: SerialPin;
        rx: SerialPin;
        baud: BaudRate;
    }


    let e32Pins = new E32PinConfig();

    let initialized = false;
    function init() {
        if (initialized) return;
        initialized = true;
//        onDataReceived(handleDataReceived);
    }

    E32LORA_init()


    let onReceivedStringHandler: (receivedString: string) => void;

    serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
        let str: string = serial.readString()
        onReceivedStringHandler(str)
    //    basic.showIcon(IconNames.Heart)
    //    OLED.writeStringNewLine(serial.readString())
    //    basic.showIcon(IconNames.Yes)
    })




    /**
     * decToHexString
     *
     * https://stackoverflow.com/questions/50967455/from-decimal-to-hexadecimal-without-tostring
     */
    function decToHexString(int: number, base: number): string {
//        let letters = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
        let letters = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"];
        let returnVal = "";
        if (base > 1 && base < 37) {
            while (int != 0) {
                let rest = int % base;
                int = Math.floor(int / base);
                returnVal = letters[rest] + returnVal;
            }
        }
        if (returnVal == "") {
            returnVal = "0"
        }
        if (returnVal.length == 1) {
            returnVal = "0" + returnVal
        }
        return returnVal;
    }

    function decToBcd(value: number): number {
        return (Math.floor(value / 10) << 4) + (value % 10)
    }

    function bcdToDec(value: number): number {
        return Math.floor(value / 16) * 10 + (value % 16)
    }


// ==========================================================================
// Export Functions.
// ==========================================================================


    /**
     * errorHalt
    */
    function errorHalt(errno: number) {
        while (true) {
          basic.showIcon(IconNames.Sad);
          basic.pause(2000)
          basic.showString("E32:" + convertToText(errno));
        }
    }

    /**
     * buffer2string
    */
    function buffer2string(buf: Buffer): string {
        let str: string = "";
        let recArray=buf.toArray(NumberFormat.UInt8LE)
        for (let idx = 0; idx <= recArray.length - 1; idx++) {
            str = str + (decToHexString(recArray[idx], 16) + " ")
        }
      return str;
    }


    /**
     * e32Init
     */
    //% weight=44
    //% block="E32LORA pin config:|M0: %m0 M1: %m1 AUX: %aux|TX: %tx RX: %rx BAUD: %baud"
    //% m0.defl=DigitalPin.P16 m1.defl=DigitalPin.P12 aux.defl=DigitalPin.P1 tx.defl=SerialPin.P2 rx.defl=SerialPin.P8 baud.defl=BaudRate.BaudRate9600
      export function e32Init(m0: DigitalPin, m1: DigitalPin, aux: DigitalPin, tx: SerialPin, rx: SerialPin, baud: BaudRate) {

          serial.redirect(rx, tx, baud)

          e32Pins.m0 = m0;
          e32Pins.m1 = m1;
          e32Pins.aux= aux;
          e32Pins.tx= tx;
          e32Pins.rx= rx;
          e32Pins.baud = baud;
          setNormalMode()
    }



    /**
     * Registers code to run when the radio receives a string.
     */
    //% help=radio/on-received-string
    //% block="on e32radio received" blockGap=16
    //% useLoc="E32LORA.onDataPacketReceived" draggableParameters=reporter
    export function onReceivedString(cb: (receivedString: string) => void) {
        init();
        onReceivedStringHandler = cb;
    }


    /**
     * e32SendString
     */
    //% block
    //% weight=50
    export function e32SendString (str: string) {
      setNormalMode()
      serial.writeLine(str)
    }

    /**
     * setSetupMode
     */
    //% block
    //% weight=42
    export function setSetupMode () {
        pins.digitalWritePin(e32Pins.m0, 1)
        pins.digitalWritePin(e32Pins.m1, 1)
        e32auxTimeout(100)
    }

    /**
     * setNormalMode
     */
    //% block
    //% weight=40
    export function setNormalMode () {
        pins.digitalWritePin(e32Pins.m0, 0)
        pins.digitalWritePin(e32Pins.m1, 0)
        e32auxTimeout(100)
    }

    /**
     * auxPin
     */
    //% block
    //% weight=38
    export function auxPin () {
        return pins.digitalReadPin(e32Pins.aux)
    }

    /**
     * e32version
     */
    //% block
    //% weight=36
    export function e32version (): string {
      let rcvData: Buffer = null
      let params = ""

      setSetupMode()
//      basic.showNumber(pins.digitalReadPin(DigitalPin.P1))
      let dataToSend2=Buffer.fromHex("c3c3c3")
      serial.writeBuffer(dataToSend2)
      rcvData = serial.readBuffer(4)

      let recArray=rcvData.toArray(NumberFormat.UInt8LE)
      for (let idx = 0; idx <= recArray.length - 1; idx++) {
          params = "" + params + ("" + decToHexString(recArray[idx], 16) + " ")
      }
      setNormalMode()
      return params
    }

    /**
     * e32parameters
     */
    //% block
    //% weight=34
    export function e32parameters () {
      let rcvData: Buffer = null
      let params = ""

      setSetupMode()
//      basic.showNumber(pins.digitalReadPin(DigitalPin.P1))
      let dataToSend=Buffer.fromHex("c1c1c1")
      serial.writeBuffer(dataToSend)
      rcvData = serial.readBuffer(6)
      let recArray=rcvData.toArray(NumberFormat.UInt8LE)
      for (let idx = 0; idx <= recArray.length - 1; idx++) {
          params = "" + params + ("" + decToHexString(recArray[idx], 16) + " ")
      }
      setNormalMode()
      return params
    }


    /**
     * e32reset
     */
    //% block
    //% weight=34
    export function e32reset () {
      setSetupMode()
      let dataToSend=Buffer.fromHex("c4c4c4")
      serial.writeBuffer(dataToSend)
      setNormalMode()
      e32auxTimeout(100)
    }



// ==========================================================================
// Internal Functions
// ==========================================================================


    /**
     * e32auxTimeout
     */
    function e32auxTimeout(value: number) {
      basic.pause(value)
      if(auxPin() == 0){
        basic.showIcon(IconNames.Angry)
        basic.showString("e: aux timeout")
      }
    }


// ==========================================================================
// Advanced Export Functions
// ==========================================================================



    /**
     * hexString
     */
    //% block
    //% weight=20
    export function hexString(value: number): string {
        return decToHexString(value, 16)
    }

    /**
     * binaryString
     */
    //% block
    //% weight=19
    export function binaryString(value: number): string {
        return decToHexString(value, 2)
    }

    /**
     * decimalString
     */
    //% block
    //% weight=18
    export function decimalString(value: number): string {
        return decToHexString(value, 10)
    }




}

