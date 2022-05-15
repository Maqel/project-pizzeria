import {select, templates, classNames} from '../settings.js';
import AmountWidget from './AmountWidget.js';
import utils from '../utils.js';

class Product {
  constructor(id, data) {
    const thisProduct = this;
    thisProduct.id = id;
    thisProduct.data = data;
    thisProduct.renderInMenu();
    thisProduct.getElements();
    thisProduct.initAccordion();
    thisProduct.initOrderForm();
    thisProduct.initAmountWidget();
    thisProduct.processOrder();
  }
  renderInMenu(){
    const thisProduct = this;
    /*[DONE]Generate HTML based on template*/
    const generatedHTML = templates.menuProduct(thisProduct.data);
    /*[DONE]Create element using utils.createElementFromHTML*/
    thisProduct.element = utils.createDOMFromHTML(generatedHTML);
    /*[DONE]find element container*/
    const menuContainer = document.querySelector(select.containerOf.menu);
    /*[DONE]add element to menu*/
    menuContainer.appendChild(thisProduct.element);
  }
  getElements(){
    const thisProduct = this;
    thisProduct.dom = {};
    thisProduct.dom.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
    thisProduct.dom.form = thisProduct.element.querySelector(select.menuProduct.form);
    thisProduct.dom.formInputs = thisProduct.dom.form.querySelectorAll(select.all.formInputs);
    thisProduct.dom.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
    thisProduct.dom.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
    thisProduct.dom.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
    thisProduct.dom.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
  }
  initAccordion(){
    const thisProduct = this;
    /*[DONE]START: add event listener to clickable trigger on event click*/
    thisProduct.dom.accordionTrigger.addEventListener('click', function(event){
      /*[DONE]Prevent default action for event*/
      event.preventDefault();
      /*[DONE]Find active product (product that has active class)*/
      const activeProduct = document.querySelector(select.all.menuProductsActive);
      /*[DONE]If there is active product and it's not thisProduct.element, remove class active from it*/
      if (activeProduct !== thisProduct.element && activeProduct !== null) {
        activeProduct.classList.remove('active');
      }
      /*[DONE]Toggle active class on thisProduct.element*/
      thisProduct.element.classList.toggle('active');
    });
  }
  initOrderForm(){
    const thisProduct = this;
    thisProduct.dom.form.addEventListener('submit', function(event){
      event.preventDefault();
      thisProduct.processOrder();
    }); 
    for(let input of thisProduct.dom.formInputs){
      input.addEventListener('change', function(){
        thisProduct.processOrder();
      });
    }
    thisProduct.dom.cartButton.addEventListener('click', function(event){
      event.preventDefault();
      thisProduct.processOrder();
      thisProduct.addToCart();
    });
  }
  processOrder(){
    const thisProduct = this;
    /*[DONE]Covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}*/
    const formData = utils.serializeFormToObject(thisProduct.dom.form);
    /*[DONE]Set price to default price*/
    let price = thisProduct.data.price;
    /*[DONE]For every category (param)*/
    for(let paramId in thisProduct.data.params) {
      /*[DONE]Determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }*/
      const param = thisProduct.data.params[paramId];
      /*[DONE]For every option in this category*/
      for(let optionId in param.options) {
        /*[DONE]Determine option value, e.g. optionId = 'olives', option = { label: 'Olives', price: 2, default: true }*/
        const option = param.options[optionId];
        /*[DONE]Check if there is param with a name of paramId in formData and if it includes optionId*/
        const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
        /*[DONE]Check if the option is not default*/
        if (!option.default && optionSelected) {
          /*[DONE]Add option price to price variable*/
          price += option.price;
        }
        else if (option.default && !optionSelected) {
          /*[DONE]Add option price to price variable*/
          price -= option.price;
        }
        /*[IMG][DONE]Find image fit to .paramId-optionId*/
        const classImg = '.' + paramId + '-' + optionId;
        /*[IMG][DONE]Check if it was found*/
        let optionImage = thisProduct.dom.imageWrapper.querySelector(classImg);
        /*[IMG][DONE]Checking if an option is selected.*/
        if (optionImage != null) {
          if (optionSelected) {
            /*[IMG][DONE]Add class active & remove this class in next step*/
            optionImage.classList.add(classNames.menuProduct.imageVisible);
          }
          else {
            optionImage.classList.remove(classNames.menuProduct.imageVisible);
          }
        }
      } /*[DONE]*END LOOP: For every option in this category*/
    } /*[DONE]*END LOOP: For every category (param)*/
    thisProduct.priceSingle = price;
    /*[DONE]Multiply price by amount*/
    price *= thisProduct.amountWidget.value;
    /*[DONE]Update calculated price in the HTML*/
    thisProduct.dom.priceElem.innerHTML = price;
  }

  initAmountWidget() {
    const thisProduct = this;
    thisProduct.amountWidget = new AmountWidget(thisProduct.dom.amountWidgetElem);
    thisProduct.dom.amountWidgetElem.addEventListener('updated', function() {
      thisProduct.processOrder();
    });
  }
  addToCart(){
    const thisProduct = this;
    //app.cart.add(thisProduct.prepareCartProduct());
    const event = new CustomEvent('add-to-cart', {
      bubbles: true, 
      detail: {
        product: thisProduct.prepareCartProduct(),
      },
    });

    thisProduct.element.dispatchEvent(event);
  }
  prepareCartProduct(){
    const thisProduct = this;
    const productSummary = {
      id: thisProduct.id,
      name: thisProduct.data.name,
      amount: thisProduct.amountWidget.value,
      priceSingle: thisProduct.priceSingle,
      price: thisProduct.priceSingle * thisProduct.amountWidget.value,
      params: thisProduct.prepareCartProductParams(),
    };
    return productSummary;
  }
  prepareCartProductParams(){
    const thisProduct = this;
    /*[DONE]Covert form to object structure e.g. { sauce: ['tomato'], toppings: ['olives', 'redPeppers']}*/
    const formData = utils.serializeFormToObject(thisProduct.dom.form);
    const params = {};
    /*[DONE]For every category (param)*/
    for(let paramId in thisProduct.data.params){
      /*[DONE]Determine param value, e.g. paramId = 'toppings', param = { label: 'Toppings', type: 'checkboxes'... }*/
      const param = thisProduct.data.params[paramId];
      /*[DONE]Create category param in params const eg. params = { ingredients: { name: 'Ingredients', options: {}}}*/
      params[paramId] = {label: param.label, options: {} };
      /*[DONE]For every option in this category*/
      for(let optionId in param.options){
        const option = param.options[optionId];
        const optionSelected = formData[paramId] && formData[paramId].includes(optionId);
        if(optionSelected){
          params[paramId].options[optionId] = option.label;
        }
      }
    }
    return params;
  }
}
export default Product;