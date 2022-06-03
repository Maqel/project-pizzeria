import { select, settings, templates, classNames } from '../settings.js';
import utils from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking{
  constructor(element){
    const thisBooking = this;
    thisBooking.render(element);
    thisBooking.initWidgets();
    thisBooking.getData();
    thisBooking.tableSelectedData = '';
  }
  getData(){
    const thisBooking = this;
    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam =  settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [
        startDateParam,
        endDateParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,
      ],
    };

    const urls = {
      booking:       settings.db.url + '/' + settings.db.bookings + '?' + params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.events + '?' + params.eventsCurrent.join('&'),
      eventsRepeat:  settings.db.url + '/' + settings.db.events + '?' + params.eventsRepeat.join('&'),
    };
    //console.log('getData urls', urls);

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function(allResponse){
        const bookingsResponse = allResponse[0];
        const eventsCurrentResponse = allResponse[1];
        const eventsRepeatResponse = allResponse[2];
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function([booking, eventsCurrent, eventsRepeat]){
        //console.log(bookings);
        //console.log(eventsCurrent);
        //console.log(eventsRepeat);
        thisBooking.parseData(booking, eventsCurrent, eventsRepeat);
      });
      
  }
  parseData(booking, eventsCurrent, eventsRepeat) {
    const thisBooking = this;
    thisBooking.booked = {};
    /*START LOOP*/
    for (let item of booking) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }/*END LOOP*/ /*START LOOP*/
    for (let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }/*END LOOP*/ /*START LOOP*/
    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;
    /*START LOOP*/
    for (let item of eventsRepeat) {
      if (item.repeat == 'daily') {
        /*START LOOP*/
        for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }/*END LOOP*/
      }
    }/*END LOOP*/
    //console.log('thisBooking.booked', thisBooking.booked);
    thisBooking.updateDOM();
  }
  makeBooked(date, hour, duration, table){
    const thisBooking = this;
    if (typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }
    const startHour = utils.hourToNumber(hour);
    /*START LOOP*/
    for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
      if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }
      thisBooking.booked[date][hourBlock].push(table);
    }/*END LOOP*/
  }
  updateDOM() {
    const thisBooking = this;
    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    const currentActiveTable = thisBooking.dom.floorPlan.querySelector(select.booking.selectedTable);
    if (currentActiveTable) currentActiveTable.classList.remove(classNames.booking.tableSelected);
    thisBooking.tableSelectedData = null;

    let allAvailable = false;
    if (typeof thisBooking.booked[thisBooking.date] == 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ) {
      allAvailable = true;
    }
    /*START LOOP*/
    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }
      if (!allAvailable
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }/*END LOOP*/
  }

  render(element){
    const thisBooking = this;
    const generatedHTML = templates.bookingWidget();
    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = generatedHTML;

    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    thisBooking.dom.floorPlan = document.querySelector(select.booking.floorPlan);
    thisBooking.dom.bookingSubmit = document.querySelector(select.booking.submit);
    thisBooking.dom.phone = document.querySelector(select.booking.phone);
    thisBooking.dom.address = document.querySelector(select.booking.address);
    thisBooking.dom.checkboxes = thisBooking.dom.wrapper.querySelector('.booking-options');
    thisBooking.dom.starters = [];
    thisBooking.dom.form =  thisBooking.dom.wrapper.querySelector(select.booking.form);
    //console.log('thisBooking.dom.wrapper:', thisBooking.dom.wrapper);
    
  }
  initWidgets(){
    const thisBooking = this;
    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);
    thisBooking.dom.wrapper.addEventListener('updated', function(){
    });
    thisBooking.dom.wrapper.addEventListener('updated', function(){
      thisBooking.updateDOM();
    });
    thisBooking.dom.floorPlan.addEventListener('click', function (event) {
      event.preventDefault();
      if (event.target.classList.contains(classNames.booking.table)) {
        thisBooking.initTables(event);
      }
    });
    thisBooking.dom.checkboxes.addEventListener('click', function (event) {
      thisBooking.choseStarters(event);
    });
    thisBooking.dom.form.addEventListener('submit', function (event) {
      event.preventDefault();
      thisBooking.sendBooking();
    });
  }
  initTables(event) {
    const thisBooking = this;
    const targetTable = event.target;
    const targetTableId = targetTable.getAttribute('data-table');
    if (
      !targetTable.classList.contains(classNames.booking.tableBooked) &&
      !targetTable.classList.contains(classNames.booking.tableSelected)
    ) {
      const currentActiveTable = thisBooking.dom.floorPlan.querySelector(select.booking.selectedTable);
      if (currentActiveTable) currentActiveTable.classList.remove(classNames.booking.tableSelected);
      
      targetTable.classList.add(classNames.booking.tableSelected);
      thisBooking.tableSelectedData = targetTableId;
    } else if (
      !targetTable.classList.contains(classNames.booking.tableBooked) &&
      targetTable.classList.contains(classNames.booking.tableSelected)
    ) {
      targetTable.classList.remove(classNames.booking.tableSelected);
      thisBooking.tableSelectedData = null;
    } else {
      alert('This table is reserved, please choose a different one. Enjoy your meal.');
    }
  }

  choseStarters(event) {
    const thisBooking = this;
    const clickedChecbox = event.target;
    if (clickedChecbox.type === 'checkbox' && clickedChecbox.name === 'starter')
      if (clickedChecbox.checked) {
        thisBooking.dom.starters.push(clickedChecbox.value);
      } else {
        const bookingStarterIndex = thisBooking.dom.starters.indexOf(
          clickedChecbox.value
        );
        thisBooking.dom.starters.splice(bookingStarterIndex, 1);
      }
  }
  sendBooking() {
    const thisBooking = this;

    const url = settings.db.url + '/' + settings.db.bookings;
    // console.log(url);

    const bookingLoad = {
      date: thisBooking.datePicker.value,
      hour: thisBooking.hourPicker.value,
      table: parseInt(thisBooking.tableSelectedData),
      duration: parseInt(thisBooking.hoursAmount.value),
      ppl: parseInt(thisBooking.peopleAmount.value),
      starters: thisBooking.dom.starters,
      phone: thisBooking.dom.phone.value,
      address: thisBooking.dom.address.value,
    };

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingLoad),
    };
    fetch(url, options)
      .then(function (response) {
        return response.json();
      })
      .then(function (booking) {
        thisBooking.makeBooked(booking.date, booking.hour, booking.duration, booking.table);
        thisBooking.updateDOM();
      });
  }
}
export default Booking;
