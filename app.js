class Color {
  initialColors = [];
  constructor() {
    this.colorsDivs = document.querySelectorAll(".color");
    this.sliders = document.querySelectorAll(".sliders");
    this.inputs = document.querySelectorAll('input[type="range"]');
    this.currentHexes = document.querySelectorAll(".color h2");
    this.popup = document.querySelector(".copy-container");
    this.adjustbuttons = document.querySelectorAll(".adjust");
    this.lockButtons = document.querySelectorAll(".lock");
    this.closeAdjustmentBtns = document.querySelectorAll(".close-adjustment");
    this.setColor();
    this.addListeners();
  }

  randomColor = () => {
    return chroma.random();
  };

  setColor = (event, savedColors) => {
    // set color to DIV

    this.colorsDivs.forEach((div, index) => {
      let randomColor = null;

      if (savedColors) {
        // colors from local storage
        randomColor = chroma(savedColors[index]);
      } else {
        // check if color is locked`
        if (div.classList.contains("locked")) {
          randomColor = this.initialColors[index];
          return;
        } else {
          randomColor = this.randomColor();
          this.initialColors[index] = chroma(randomColor).hex();
        }
      }

      const hexText = div.children[0]; // h2 Name of Color
      div.style.backgroundColor = randomColor;
      hexText.innerHTML = randomColor;
      //check the contrast
      this.checkTextContrast(randomColor, hexText);
      this.checkTextContrast(randomColor, this.lockButtons[index]);
      this.checkTextContrast(randomColor, this.adjustbuttons[index]);

      // colorizing sliders (range inputs)

      const inputs = this.sliders[index].querySelectorAll(
        "input[type='range']"
      );
      const hue = inputs[0];
      const brightness = inputs[1];
      const saturation = inputs[2];
      this.colorizeSliders(randomColor, hue, brightness, saturation);
    });

    // set inputs position according color
    this.sliders.forEach((slider, index) => {
      this.setInputPosition(slider, index);
    });
  };

  colorizeSliders = (color, hue, brightness, saturation) => {
    //scale saturation
    const noSat = color.set("hsl.s", 0);
    const maxSat = color.set("hsl.s", 1);
    const scaleSat = chroma.scale([noSat, color, maxSat]);
    saturation.style.backgroundImage = `linear-gradient(to right, 
      ${scaleSat(0)}, ${scaleSat(1)})`;
    //scale brightness

    const midBright = color.set("hsl.l", 0.5);
    const scaleBright = chroma.scale(["black", midBright, "white"]);
    brightness.style.backgroundImage = `linear-gradient(to right, 
      ${scaleBright(0)}, ${scaleBright(0.5)} ,${scaleBright(1)})`;

    // scale hue
    hue.style.backgroundImage = `linear-gradient(to right, rgb(204,75,75), rgb(204,204,75), rgb(75,204,75), rgb(75,204,204), rgb(75,75,204), rgb(204,75,204), rgb(204,75,75))`;
  };

  addListeners = () => {
    //  randomize color
    const btnRandomizer = document.querySelector(".generate");
    btnRandomizer.addEventListener("click", this.setColor);

    // onSlidersMove change background color of pallete
    this.sliders.forEach((slider) => {
      slider.addEventListener("input", this.hslControls);
    });

    // onSliderMove change Color Name in Color pallete
    this.colorsDivs.forEach((div, index) => {
      div.addEventListener("input", () => {
        this.updateTextUI(index);
      });
    });

    //click on color number
    this.currentHexes.forEach((hex) => {
      hex.addEventListener("click", this.colorCopy);
    });
    this.popup.addEventListener("transitionend", () => {
      const popupBox = this.popup.children[0];
      this.popup.classList.remove("active");
      popupBox.classList.remove("active");
    });

    this.lockButtons.forEach((btn) => {
      btn.addEventListener("click", this.colorLock);
    });

    //open adjustmentcolor pabnel
    this.adjustbuttons.forEach((item, index) => {
      item.addEventListener("click", () => {
        this.sliders[index].classList.toggle("active");
      });
    });
    //close adjustment panel
    this.closeAdjustmentBtns.forEach((btn) =>
      btn.addEventListener("click", (e) => {
        e.target.parentElement.classList.remove("active");
      })
    );
    //save container
    document
      .querySelector(".save")
      .addEventListener("click", this.openSavePanel);
    document
      .querySelector(".close-save")
      .addEventListener("click", this.closeSavePanel);
    document
      .querySelector(".submit-save")
      .addEventListener("click", this.saveToLocalStorage);

    //open library
    document
      .querySelector(".library")
      .addEventListener("click", this.openLibrary);

    // close library
    document
      .querySelector(".close-library")
      .addEventListener("click", this.closeLibrary);

    document.querySelector(".library-popup").addEventListener("click", (e) => {
      if (!e.target.classList.contains("custom-palette__select")) {
        return;
      }
      this.closeLibrary();
      const colors = JSON.parse(localStorage.getItem("paletts"));
      let palette = colors.find((elem) => elem.id == e.target.dataset.id);
      this.initialColors = palette.color;

      this.setColor(event, this.initialColors);
    });
  };

  colorCopy = (e) => {
    const el = document.createElement("textarea");
    el.value = e.target.innerText;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    // pop up
    this.popup.classList.add("active");
    this.popup.children[0].classList.add("active");
  };

  checkTextContrast = (color, text) => {
    const luminance = chroma(color).luminance();
    if (luminance > 0.5) {
      text.style.color = "black";
    } else {
      text.style.color = "white";
    }
  };

  hslControls = (e) => {
    const index =
      e.target.dataset.bright || e.target.dataset.sat || e.target.dataset.hue;
    const inputs = e.target.parentElement.querySelectorAll(
      'input[type="range"]'
    );
    // get input data
    const hue = inputs[0];
    const brightness = inputs[1];
    const saturation = inputs[2];
    //use initial colors not to loose color by brightness change
    let bgColor = this.initialColors[index];

    let color = chroma(bgColor)
      .set("hsl.s", saturation.value)
      .set("hsl.l", brightness.value)
      .set("hsl.h", hue.value);
    //set color to the div based on input data
    this.colorsDivs[index].style.backgroundColor = color;
    this.colorizeSliders(color, hue, brightness, saturation);
  };

  updateTextUI = (index) => {
    const activeDiv = this.colorsDivs[index];
    const color = chroma(activeDiv.style.backgroundColor);
    const textHex = activeDiv.querySelector("h2");
    const icons = activeDiv.querySelectorAll(".controls button");
    textHex.innerText = color.hex();
    this.checkTextContrast(color, textHex);
    for (let icon of icons) {
      this.checkTextContrast(color, icon);
    }
  };

  setInputPosition = (slider, index) => {
    const inputs = slider.querySelectorAll("input");
    const color = this.initialColors[index];
    inputs.forEach((input) => {
      switch (input.name) {
        case "hue": {
          input.value = Math.floor(chroma(color).hsl()[0]);
          break; // set hue
        }
        case "brightness": {
          input.value = chroma(color).hsl()[2].toFixed(2);
          break;
        }
        case "saturation": {
          input.value = chroma(color).hsl()[1].toFixed(2);
          break;
        }
      }
    });
  };

  colorLock = (e) => {
    const colorDiv = e.target.closest(".color");
    colorDiv.classList.toggle("locked");
    if (colorDiv.classList.contains("locked")) {
      e.target.children[0].className = "fas fa-lock";
    } else {
      e.target.children[0].className = "fas fa-lock-open";
    }
  };

  openSavePanel() {
    const container = document.querySelector(".save-container");
    container.classList.toggle("active");
    container.children[0].classList.toggle("active");
  }

  closeSavePanel(e) {
    e.target.parentElement.classList.remove("active");
    e.target.closest(".save-container").classList.remove("active");
  }

  saveToLocalStorage = (e) => {
    let localPaletts = null;
    let id = null;

    let value = document.querySelector(".save-name").value;
    if (!value) {
      alert("Please put a name of pallet");
      return;
    }

    if (localStorage.getItem("paletts") === null) {
      localPaletts = [];
      id = 0;
    } else {
      localPaletts = JSON.parse(localStorage.getItem("paletts"));
      id = localPaletts.length;
    }

    const palette = { name: value, color: this.initialColors, id };

    localPaletts.push(palette);
    localStorage.setItem("paletts", JSON.stringify(localPaletts));
    // close the panel
    this.closeSavePanel(e);
    document.querySelector(".save-name").value = "";
  };

  openLibrary = () => {
    const container = document.querySelector(".library-container");
    container.classList.add("active");
    container.children[0].classList.add("active");

    const palett = JSON.parse(localStorage.getItem("paletts"));

    const existingPallets = container.querySelectorAll(".custom-palette");
    if (existingPallets.length != 0) {
      existingPallets.forEach((item) => item.remove());
    }
    if(!palett){
      return
    }
    palett.forEach((item) => {
      const elem = document.createElement("div");
      elem.classList.add("custom-palette");
      elem.insertAdjacentHTML(
        "beforeEnd",
        this.renderPalette(item.name, item.color, item.id)
      );
      container.children[0].appendChild(elem);
    });
  };

  closeLibrary = () => {
    document.querySelector(".library-container").classList.remove("active");
    document.querySelector(".library-popup").classList.remove("active");
  };

  renderPalette = (name, color, id) => {
    return `
    <div class="custom-palette__name" ">${name}</div>
    <div class="custom-palette__colors">
      <div class="saved-color" style="background-color:${color[0]}"></div>
      <div class="saved-color" style="background-color:${color[1]}"></div>
      <div class="saved-color" style="background-color:${color[2]}"></div>
      <div class="saved-color" style="background-color:${color[3]}"></div>
      <div class="saved-color" style="background-color:${color[4]}"></div>
    </div>
    <button class="custom-palette__select" data-id="${id}">Select</button>       
    `;
  };
}

let color = new Color();
