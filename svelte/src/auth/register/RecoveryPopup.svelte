<script>
  // @ts-nocheck

  import { parsePhoneNumber } from "awesome-phonenumber";
  import { createEventDispatcher, onMount } from "svelte";
  import { cubicOut } from "svelte/easing";
  import { tweened } from "svelte/motion";
  import {
    tada,
    stageStore,
    timeoutPromise,
    updateValidWidth,
    postData,
  } from "./Helper";

  const dispatch = createEventDispatcher();
  function close() {
    dispatch("close");
  }

  let exampleCountryCode = "1";
  postData({ url: "get_country_code", getRequest: true }).then(
    (data) => (exampleCountryCode = data)
  );

  let infoVal = "";
  let infoValidType = "valid";
  let infoShowValidation, tadaDisabled;
  async function validateInfo() {
    const updateMsg = async function (message, validType, tada = true) {
      if (tada && infoShowValidation) {
        infoShowValidation = false;
        tadaDisabled = false;
        await timeoutPromise(0);
      } else tadaDisabled = !tada;
      if (!infoShowValidation) {
        infoShowValidation = true;
        await timeoutPromise(0);
      }
      const msgEl = document.querySelector(".info-group .validation");
      msgEl.dataset.msg = message;
      infoValidType = validType;
    };
    infoVal = infoVal.trim();

    let invalidPhone, invalidEmail;
    finishValidation: if (infoVal === "") {
      await updateMsg("Missing information", "error");
    } else {
      // We are kind of assuming that these two regex expressions don't share any string they both match
      if (!/^[\d +\(\)-]+$/.test(infoVal)) invalidPhone = true;
      if (
        !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(
          infoVal
        )
      )
        invalidEmail = true;
      if (invalidEmail && invalidPhone) {
        await updateMsg("Invalid as email and phone number", "error");
        break finishValidation;
      }
      // Elaborate on validating the input as if it were a phone number
      if (invalidEmail) {
        if (!infoVal.startsWith("+")) {
          await updateMsg(
            "Phone number must start with country code (e.g. +" +
              exampleCountryCode +
              ")",
            "error"
          );
          break finishValidation;
        }
        await updateMsg("Checking country code...", "stall", false);
        // prettier-ignore
        const recognized_country_code = await postData({url: "phone_number_has_country_code", data: () => infoVal, plainText: true});
        if (!recognized_country_code) {
          await updateMsg("Country code unrecognized", "error");
          break finishValidation;
        }
        await updateMsg("Validating number...", "stall", false);
        // prettier-ignore
        const is_valid = await postData({url: "is_valid_phone_number", data: () => infoVal, plainText: true});
        if (!is_valid) {
          await updateMsg("Invalid phone number", "error");
          break finishValidation;
        }
      }
      // ...or as an email
      if (invalidPhone) {
        await updateMsg("Checking validity & blacklist...", "stall", false);
        // prettier-ignore
        const isValid = await postData({url: "fast_is_valid_email", data: () => infoVal, plainText: true});
        if (!isValid) {
          await updateMsg("Invalid email address.", "error");
          break finishValidation;
        }
      }

      await updateMsg("Checking duplicity...", "stall", false);
      const getData = () => {
        return {
          info: infoVal,
          type: invalidEmail ? "phone" : "email",
        };
      };
      // prettier-ignore
      const isInuse = await postData({ url: "recovery_option_isinuse", data: getData, plainText: true })
      if (isInuse) {
        await updateMsg("You already have this.", "error");
        break finishValidation;
      }

      await updateMsg("", "valid");
      infoShowValidation = false;
      await timeoutPromise(0);
    }
    infoValidEl && updateValidWidth(infoValidEl);
    return invalidEmail ? "phone" : "email";
  }
  function clearValid() {
    infoShowValidation = false;
    infoValidType = "valid";
  }

  let formPromise, formPromiseState;
  $: ((...args) => {
    if (!formPromise) return;
    formPromiseState = "pending";
    formPromise
      .then(() => (formPromiseState = ""))
      .catch(() => (formPromiseState = "failure"));
  })(formPromise);
  // formPromiseState = "success";

  const formMarginBottom = tweened(0, {
    duration: 400,
    easing: cubicOut,
  });
  let formErrorEl, infoValidEl;
  $: (() => {
    if (!formErrorEl && !infoValidEl) formMarginBottom.set(0);
    else {
      let el = formErrorEl ?? infoValidEl;
      formMarginBottom.set(el.getBoundingClientRect().height);
    }
  })();

  let list = [];
  let finishedLoadingList = false;
  postData({ url: "get_recovery_options", getRequest: true }).then((data) => {
    data.map((el) => {
      if (el.type === "phone") {
        const pn = parsePhoneNumber(el.info);
        el.info = `+${pn.getCountryCode()} ${pn.g.number.national}`;
        return el;
      } else return el;
    });
    list = data;
    finishedLoadingList = true;
  });
  async function addOption() {
    formPromise = null;
    const type = await validateInfo();
    if (infoValidType !== "valid") return;
    const getData = () => {
      return {
        info: infoVal,
        infoType: type,
      };
    };
    formPromise = postData({ url: "add_recovery_option", data: getData });
    document.activeElement.blur();
    const data = await formPromise;
    list = [...list, { info: infoVal, type, id: data.id }];
    infoVal = "";
  }

  function deleteItem(e) {
    const id = parseInt(e.target.closest(".option").dataset.id);
    const index = list.findIndex((el) => el.id === id);
    list.splice(index, 1);
    list = list;
    const getData = () => {
      return {
        id,
      };
    };
    postData({ url: "remove_recovery_option", data: getData });
  }

  async function validateEdit(val, mode) {
    if (list.some((item) => item.info === val && item.id !== editing))
      return false;
    console.log(val, mode);
    if (mode === "email") {
      if (
        !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(
          val
        )
      )
        return false;
      const isValid = await postData({
        url: "fast_is_valid_email",
        data: () => val,
        plainText: true,
      });
      if (!isValid) return false;
    } else if (mode === "phone") {
      if (!/^[\d +\(\)-]+$/.test(val)) return false;
      const isValid = await postData({
        url: "is_valid_phone_number",
        data: () => val,
        plainText: true,
      });
      if (!isValid) return false;
    }
    const getData = () => {
      return {
        info: infoVal,
        type: invalidEmail ? "phone" : "email",
      };
    };
    const isInuse = await postData({
      url: "recovery_option_isinuse",
      data: getData,
      plainText: true,
    });
    if (isInuse) return false;
    return true;
  }

  let editing = -1;
  let editingVal;
  function editItem(e) {
    const id = parseInt(e.target.closest(".option").dataset.id);
    editingVal = e.target
      .closest(".option")
      .querySelector(".detail")
      .textContent.trim();
    editing = id;
    setTimeout(() => {
      document.querySelector(".editing").focus();
    }, 0);
  }
  async function stopEditSave() {
    const item = list.find((el) => el.id === editing);
    if (
      editingVal !== item.info &&
      (await validateEdit(editingVal, item.type))
    ) {
      item.info = editingVal;
      const getData = () => {
        return {
          id: item.id,
          value: editingVal,
        };
      };
      postData({ url: "edit_recovery_option", data: getData });
    } else if (editingVal !== item.info) editErrorAnim(editing);
    editing = -1;
  }
  document.onclick = (e) => {
    if (
      !e.target.closest(".option:has(.editing)") &&
      document.querySelector(".editing")
    )
      stopEditSave();
  };
  document.onkeydown = (e) => {
    if (document.querySelector(".editing") && e.key === "Enter") stopEditSave();
  };

  // animation for when an edit is unsuccessful
  const { _, css: keyframeFunc } = tada(null, {
    duration: null,
    directionChanges: 3,
    intensity: 15,
  });
  const keyframes = [];
  const numKeyframes = 50;
  for (let i = 0; i <= numKeyframes; i++) {
    const str = keyframeFunc(i / numKeyframes);
    const [key, value] = str.slice(0, -1).split(": ");
    const newObj = new Object();
    newObj[key] = value;
    keyframes.push(newObj);
  }
  keyframes.at(0).color = "#a10505";
  keyframes.at(-1).color = "#383838";
  function editErrorAnim(id) {
    document
      .querySelector('.option[data-id="' + id + '"] .detail')
      .animate(keyframes, { duration: 750 });
  }
</script>

<main>
  <button class="close" on:click={close}><ion-icon name="close" /></button>
  <h1>Add Recovery Options</h1>
  <p class="text">
    In case you lose access to your email/phone number, it is good to have extra
    "emergency" options you can use to log in (perhaps the emails/phone numbers
    of friends and family). You <i>will not</i> need to verify these to add them,
    so double check yourself you're entering the details without mistakes.
  </p>
  <form
    on:submit|preventDefault={addOption}
    style="margin-bottom: {$formMarginBottom}px;"
  >
    <span style="position: relative;" class="{infoValidType} info-group">
      <input
        type="text"
        placeholder="email/phone number"
        bind:value={infoVal}
        on:input={clearValid}
        on:focusout={() => {
          if (!infoVal) clearValid();
        }}
        disabled={formPromiseState === "pending" ||
          formPromiseState === "success"}
      />
      {#if infoShowValidation}
        <div
          class="validation"
          in:tada={{ duration: 400, disable: tadaDisabled }}
          data-msg
          bind:this={infoValidEl}
        />
      {/if}
    </span>
    <button type="submit" class={formPromiseState}>
      {#if formPromiseState === "pending"}
        <div class="spinner" />
      {:else if formPromiseState === "success"}
        <ion-icon name="checkmark" />
      {:else}
        <ion-icon name="add" />
      {/if}
      {#await formPromise}{""}{:catch error}
        <div class="form-error" bind:this={formErrorEl}>
          An error has occured.
        </div>
      {/await}
    </button>
  </form>
  <hr />
  <div class="list" class:hidden={!finishedLoadingList}>
    {#each list as { info, type, id } (id)}
      <div class="option" data-id={id}>
        <button class="delete" title="Remove" on:click={deleteItem}
          ><ion-icon name="trash" /></button
        >
        <div class="detail">
          {#if editing === id}
            <input class="editing" bind:value={editingVal} />
            <button
              class="editing-cancel"
              title="Cancel edit"
              on:click={() => (editing = -1)}><ion-icon name="close" /></button
            >
          {:else}
            {info}
            {#if type === "email"}
              <ion-icon name="mail" />
            {:else}
              <ion-icon name="call" />
            {/if}
          {/if}
        </div>
        <button class="edit" title="Edit" on:click={editItem}
          ><ion-icon name="pencil" /></button
        >
      </div>
    {/each}
    {#if list.length === 0}
      <div class="nothing-yet">Currently no recovery options.</div>
    {/if}
  </div>
</main>

<style>
  .hidden {
    display: none !important;
  }
  h1 {
    text-align: center;
    margin-top: 15px;
    margin-bottom: 0;
    font-weight: 500;
    color: #493633;
    width: 86%;
    margin-left: 7%;
  }
  .text {
    margin-top: 0;
    width: 80%;
    margin-left: 10%;
    color: rgb(48, 48, 48);
  }

  form {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  form input {
    padding: 3px 5px;
    font-size: 100%;
    font-family: "Source Code Pro", monospace;
    color: #3c3c3c;
    width: 250px;
    border: 1px solid #000;
    box-shadow: inset 1px 1px #d5d5d5;
    border-radius: 3px;
  }
  input:focus {
    outline: 3px solid rgba(0, 0, 0, 0.135);
  }
  button[type="submit"] {
    height: 28px;
    width: 28px;
    background: none;
    border: 2px solid currentColor;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-left: 7px;
    color: #6b6b6b;
    border-radius: 3px;
    font-size: 100%;
    padding: 0;
  }
  button[type="submit"] ion-icon {
    font-size: 160%;
  }
  button[type="submit"]:hover {
    background: rgb(232, 232, 232);
    cursor: pointer;
  }
  button[type="submit"]:hover:active {
    margin-bottom: -3px;
    background: rgb(202, 202, 202);
  }

  button[type="submit"].pending {
    pointer-events: none;
    padding: 0%;
    background: #fff;
    overflow: hidden;
    outline: none !important;
    border: none;
  }
  button[type="submit"].pending .spinner {
    width: 20px;
    height: 20px;
    border: 3px solid #654c44;
    border-radius: 50%;
    animation-name: rotate;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
    animation-duration: 2s;
    position: relative;
  }
  button[type="submit"].pending .spinner::after {
    content: "";
    position: absolute;
    right: 0;
    z-index: 100;
    width: 13px;
    height: 13px;
    background: #fff;
    transform: translate(3px, -3px);
  }
  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  button[type="submit"].success {
    pointer-events: none;
    color: rgb(48, 92, 35);
    --ionicon-stroke-width: 60px;
    padding: 0;
    font-size: 140%;
  }
  button[type="submit"].failure {
    position: relative;
  }
  .form-error {
    position: absolute;
    font-size: 86%;
    bottom: 0;
    transform: translate(calc(30px - 100%), 100%);
    left: 0;
    max-width: 200px;
    width: max-content;
    color: #671818;
  }

  hr {
    height: 2px;
    background: #eaeaea;
    width: 90%;
    margin-top: 20px;
    margin-bottom: 20px;
    border: none;
  }
  .nothing-yet {
    font-style: italic;
    text-align: center;
    color: #545454;
  }

  .list {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-bottom: 30px;
  }
  .option {
    display: flex;
    justify-content: space-between;
    width: 75%;
    margin: 3px 0;
    color: #383838;
    align-items: center;
  }
  .delete {
    padding: 5px;
    margin-bottom: -5px;
    margin-top: -5px;
    cursor: pointer;
    height: 100%;
    background: none;
    border: none;
    display: block;
    box-sizing: content-box;
    font-size: 100%;
  }
  .detail {
    display: flex;
    align-items: center;
    font-family: "Source Code Pro", monospace;
    word-spacing: -1px;
    letter-spacing: -1px;
    word-wrap: anywhere;
    position: relative;
  }
  .detail ion-icon {
    color: #565656;
    margin-left: 7px;
    flex-shrink: 0;
  }
  .edit {
    font-size: 115%;
    height: 100%;
    padding: 5px;
    margin-bottom: -5px;
    margin-top: -5px;
    cursor: pointer;
    background: none;
    border: none;
    display: block;
    box-sizing: content-box;
  }
  .delete:hover,
  .edit:hover {
    color: rgb(124, 124, 124);
  }

  .editing {
    font-family: "Source Code Pro", monospace;
    outline: none !important;
    padding-left: 20px;
    width: 200px;
  }
  .editing-cancel {
    position: absolute;
    display: flex;
    align-items: center;
    height: 100%;
    margin-left: 2px;
    cursor: pointer;
    border: none;
    background: none;
    font-size: 100%;
    padding: 0;
  }
  .editing-cancel ion-icon {
    margin: 0;
    color: #2a2a2a;
    font-size: 120%;
  }
  .editing-cancel:hover ion-icon {
    color: rgb(117, 117, 117);
  }
  ion-icon {
    pointer-events: none;
  }
</style>
