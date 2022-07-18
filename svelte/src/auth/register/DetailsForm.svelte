<script>
  import "./form-style.css";
  import { createEventDispatcher, onMount } from "svelte";
  import {
    turnPage,
    newPageIn,
    focusInput,
    setWarning,
    specialError,
    postData,
  } from "./Helper";
  import InputField from "./InputField.svelte";
  import SubmitButton from "./SubmitButton.svelte";

  const dispath = createEventDispatcher();

  export let doTransition;

  let username, email, phonenumber;
  const state = {
    promise: undefined,
    disabled: false,
    editMode: false,
  };

  function clearErrors(fields) {
    fields.forEach((el) => {
      el.input.setCustomValidity("");
      setWarning(el.input, "");
      el.updateInput();
    });
  }
  function validateFields(fields) {
    return fields
      .map((el) => {
        validateInput(el.name, false, true, false);
        if (el.input.validity.customError) return false;
        return true;
      })
      .every((el) => (el ? true : false));
  }

  const detailsSubmit = function () {
    state.promise = undefined;
    // Clear all errors
    clearErrors([username, email, phonenumber]);
    setTimeout(() => {
      if (!validateFields([username, email, phonenumber])) return;
      state.promise = detailsPost();
      state.disabled = true;
      state.promise
        .then(() => dispath("success", { text: "Hello!" }))
        .catch(() => (state.disabled = false));
    }, 0);
  };
  const getDetailsData = () => {
    return {
      username: username.value,
      email: email.value,
      phonenumber: phonenumber.value,
    };
  };

  let detailsPost;
  onMount(() => {
    // prettier-ignore
    detailsPost = postData.bind(null, "register_details", getDetailsData, {
      "[invalid_phone]": specialError.bind(state, phonenumber, "Phone number invalid!"),
      "[email_taken]": specialError.bind(state, email, "Email has already been registered before!"),
      "[username_taken]": specialError.bind(state, username, "Username taken!"),
    });
  });

  const isTaken = (field, name) =>
    postData(`is_taken/${name}/${field.value || "_"}`, null, null, true);
  const validateInput = function (
    key,
    ignoreMissing = false,
    nowarn = false,
    noasync = false
  ) {
    // console.log(noasync);
    const isEmpty = (value) => value === "" || value === "_";
    switch (key) {
      case "username": {
        username.value = username.value.trim();
        username.updateInput();

        if (!ignoreMissing && isEmpty(username.value)) {
          username.input.setCustomValidity("Enter your username.");
          focusInput(username.input);
          break;
        }
        if (0 < username.value.length && username.value.length < 3) {
          username.input.setCustomValidity(
            "Username must be more than 2 characters long."
          );
          break;
        }
        if (!noasync)
          isTaken(username, "username").then((taken) => {
            if (taken.is_taken) {
              username.updateInput();
              username.input.setCustomValidity("Username taken!");
            }
          });

        username.input.setCustomValidity("");
        break;
      }
      case "email": {
        email.value = email.value.trim();
        email.updateInput();

        if (
          !ignoreMissing &&
          isEmpty(email.value) &&
          isEmpty(phonenumber.value)
        ) {
          email.input.setCustomValidity(
            "Need to provide at least a phone number OR email."
          );
          break;
        }
        if (
          !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(
            email.value
          ) &&
          !isEmpty(email.value)
        ) {
          email.input.setCustomValidity("Not a valid email address.");
          break;
        }
        if (!noasync)
          isTaken(email, "email").then((taken) => {
            if (taken.is_taken) {
              email.updateInput();
              email.input.setCustomValidity(
                "Email has already been registered before!"
              );
            }
          });

        email.input.setCustomValidity("");
        break;
      }
      case "phonenumber": {
        phonenumber.value = phonenumber.value.trim();
        phonenumber.updateInput();

        if (
          !ignoreMissing &&
          isEmpty(email.value) &&
          isEmpty(phonenumber.value)
        ) {
          phonenumber.input.setCustomValidity(
            "Need to provide at least a phone number OR email."
          );
          break;
        }

        phonenumber.input.setCustomValidity("");
        break;
      }
      default:
        break;
    }
  };

  onMount(() => {
    doTransition = true;
    postData("register_get_details", null, null, true)
      .then((data) => {
        username.value = data["username"];
        email.value = data["email"] ?? "";
        phonenumber.value = data["phonenumber"] ?? "";
        state.editMode = true;
      })
      .catch(() => {});
  });
</script>

<div
  class="page"
  in:newPageIn={{ duration: 400, delay: 200, doTransition }}
  out:turnPage={{ duration: 400, degrees: -5, doTransition }}
>
  <h1>Registration Form</h1>
  <form on:submit|preventDefault={detailsSubmit} novalidate>
    <InputField
      {validateInput}
      name="username"
      autocomplete={false}
      disabled={state.disabled}
      bind:this={username}
    />
    <InputField
      {validateInput}
      name="email"
      type="email"
      disabled={state.disabled}
      bind:this={email}
    />
    <InputField
      {validateInput}
      name="phonenumber"
      type="number"
      label="Phone Number:"
      disabled={state.disabled}
      bind:this={phonenumber}
    />

    <div class="group-submit">
      <SubmitButton
        text={!state.editMode ? "Register" : "Update"}
        disabled={state.disabled}
      />
      {#if state.promise}
        {#await state.promise}
          <div class="spinner">
            <div class="circsec circ1" />
            <div class="circsec circ2" />
            <div class="circsec circ3" />
          </div>
          <span class="status waiting">Please wait...</span>
        {:then data}
          <span class="status success">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              xmlns:xlink="http://www.w3.org/1999/xlink"
              version="1.1"
              id="Capa_1"
              x="0px"
              y="0px"
              viewBox="0 0 507.506 507.506"
              style="enable-background: new 0 0 507.506 507.506"
              xml:space="preserve"
              width="512"
              height="512"
            >
              <g>
                <path
                  style="fill: rgb(47, 112, 28)"
                  d="M163.865,436.934c-14.406,0.006-28.222-5.72-38.4-15.915L9.369,304.966c-12.492-12.496-12.492-32.752,0-45.248l0,0   c12.496-12.492,32.752-12.492,45.248,0l109.248,109.248L452.889,79.942c12.496-12.492,32.752-12.492,45.248,0l0,0   c12.492,12.496,12.492,32.752,0,45.248L202.265,421.019C192.087,431.214,178.271,436.94,163.865,436.934z"
                />
              </g>
            </svg>
          </span>
        {:catch error}
          <span class="status error">{error.message}</span>
        {/await}
      {/if}
    </div>
  </form>
</div>

<style>
  h1 {
    margin-left: 30px;
    color: rgb(54, 54, 54);
  }
</style>
