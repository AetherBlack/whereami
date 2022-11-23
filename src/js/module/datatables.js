import groupBy from "lodash/groupBy"
import toInteger from "lodash/toInteger"
import { Events } from "../class/Event"
import { daysFr, ListEvents } from "../class/ListEvents"
import { getAllIcons, getData, getTags, optionDatatable1 } from "./xhr"
import DataTable from 'datatables.net-bs/js/dataTables.bootstrap.min.js'
import 'datatables.net-fixedcolumns/js/dataTables.fixedColumns'
import 'datatables.net-bs/css/dataTables.bootstrap.min.css'

const FRACTION_FOR_ORANGE = 2 / 3
const FRACTION_FOR_RED = 0.90

/**
 *
 * @returns
 */
export function getLoader() {
    const center = document.createElement('center')
    const divLoader = document.createElement('div')
    divLoader.setAttribute('class', 'lds-dual-ring')
    center.appendChild(divLoader)
    return center
}


/**
 * Fills the title and inner with the icons. For table byEmployee, adds an event 
 * listenner to redirect to byLocation on click on the key's place
 * @param {HTMLBaseElement} element 
 * @param {Array} icons 
 * @param {boolean} tablePersonne 
 */
function setTitleWithIcons(element, icons, tablePersonne = false) {
    for (let dic of icons) {
        element.title = dic.prefix + "(" + dic.label + ")\n" + element.title
        if (tablePersonne) {
            let a = document.createElement('a')
            a.innerText = dic.prefix + "(" + dic.label + ")\n"
            a.addEventListener('click', () => {
                document.getElementById('finalPath').innerText = "Locations"
                document.getElementById('myapp').innerHTML = ''
                document.getElementById('myapp').appendChild(getLoader())
                getData(document.getElementById('dtStart').value, document.getElementById('dtEnd').value, 'place', 'byLocation', dic.prefix)
            })
            element.appendChild(a)
        }
        else
            element.innerText = element.innerText + dic.prefix
    }
}


export function newTableSeen(response, dtStart, dtEnd) {
    const res = JSON.parse(response)
    var totalPeople = 1
    const today = new Date()
    const periodLength = toInteger((new Date(dtEnd) - new Date(dtStart)) / (1000 * 3600 * 24))

    const table = document.createElement('table')
    table.setAttribute('id', 'seen')
    table.setAttribute('class', 'table table-striped')

    let thead = document.createElement('thead')
    let tbody = document.createElement('tbody')

    const headLine = document.createElement('tr')
    headLine.appendChild(newCell('th', ""))

    Object.keys(res).forEach(person => {
        let th = newCell('th', person);
        headLine.appendChild(th);

        var newLine = document.createElement('tr');
        let tr = newCell('td', person);
        newLine.appendChild(tr);
        tbody.appendChild(newLine);

        totalPeople++;
    })

    thead.appendChild(headLine);
    table.appendChild(thead);
    table.appendChild(tbody);

    let icons = getAllIcons().onload();
    let groupedIcons = groupBy(icons, 'person');
    let rows = 0;
    table.rows.forEach(r => {
        if (rows > 0) {
            let peoplerow = r.cells[0].innerText;
            for (var cellPosition = 1; cellPosition < totalPeople; cellPosition++) {

                let peoplecolumn = table.rows[0].cells[cellPosition].innerText

                let msg = ":'(";
                let title = "No title";
                var daysLastSeen = -1

                if (peoplerow === peoplecolumn) {
                    msg = "-";
                    daysLastSeen = 0
                }

                if (res[peoplerow] != null && res[peoplerow][peoplecolumn] != null) {
                    title = res[peoplerow][peoplecolumn].place;
                    msg = res[peoplerow][peoplecolumn].seen;

                    const timeLastSeen = new Date(today - new Date(msg.replace(/(\d{2})-(\d{2})-(\d{4})/, "$2/$1/$3")))
                    daysLastSeen = timeLastSeen / (1000 * 3600 * 24)
                    if (daysLastSeen < 0) {
                        res[peoplerow][peoplecolumn].count += daysLastSeen
                        res[peoplerow][peoplecolumn].count = toInteger(res[peoplerow][peoplecolumn].count)
                        daysLastSeen = 0
                    }
                    else
                        daysLastSeen = toInteger(daysLastSeen)
                    if (daysLastSeen == 0)
                        title = title + " today"
                    else
                        title = title + ' ' + daysLastSeen + ' day(s) ago'
                    title = title + " (" + res[peoplerow][peoplecolumn].count + ' time(s))'
                }


                let newCell = r.insertCell(cellPosition)
                let newText = document.createTextNode(msg)
                newCell.setAttribute('title', title)
                newCell.appendChild(newText)

                if (daysLastSeen >= toInteger(FRACTION_FOR_ORANGE * periodLength)) {
                    newCell.style = "background-color: orange;"
                }
                if (daysLastSeen == -1 || daysLastSeen >= toInteger(FRACTION_FOR_RED * periodLength) && peoplerow != peoplecolumn) {
                    newCell.style = "background-color: red;"
                    newCell.title = "Not seen in the last " + periodLength + " days"
                }

                //setTitleWithIcons(table.rows[0].cells[cellPosition], groupedIcons[peoplecolumn])
            }
            let tetrarow = Events.compute_tetragraph(peoplerow)
            if (groupedIcons[tetrarow])
                setTitleWithIcons(r.cells[0], groupedIcons[tetrarow])
        }
        rows++;
    })

    document.getElementById('myapp').innerHTML = ''
    document.getElementById('myapp').appendChild(table)
}


/**
 *
 * @param {*} response
 * @param {*} dtStart
 * @param {*} dtEnd
 * @param {*} tablename
 */
export function newTablePersonne(response, dtStart, dtEnd, tablename) {
    const table = document.createElement('table')
    const thead = document.createElement('thead')
    let tbody = document.createElement('tbody')
    const tfoot = document.createElement('tfoot')

    table.setAttribute('id', tablename)
    table.setAttribute('class', 'table table-striped')

    // var retHead = getHeader(from,to);
    // var from = new Date(dtStart)
    // var to = new Date(dtEnd)
    const head = getHeader(new Date(dtStart), new Date(dtEnd), tablename == 'byEmployee')
    thead.appendChild(head)

    const to = new Date(dtEnd)
    const res = JSON.parse(response)
    let icons = getAllIcons().onload()
    let whitelistKeys
    if (tablename === 'byLocation')
        whitelistKeys = getTags("accounted_for_keys").onload().map(element => element.word.toLowerCase())

    Object.keys(res).forEach(element => {
        let from = new Date(dtStart)
        const userListEvents = new ListEvents(element, res[element])
        if (tablename === 'byLocation') {
            tbody = getContent(tbody, head, 1, userListEvents, 'byLocation', icons, whitelistKeys)
        } else {
            tbody = getContent(tbody, head, 2, userListEvents, 'byEmployee', icons)
        }
    })

    if (tablename === 'byLocation') {
        tfoot.appendChild(getTotal(tbody))
    }

    tfoot.appendChild(getHeader(new Date(dtStart), to, tablename == 'byEmployee'))

    table.appendChild(thead)
    table.appendChild(tbody)
    table.appendChild(tfoot)
    document.getElementById('myapp').innerHTML = ''
    document.getElementById('myapp').appendChild(table)
}

/**
 *
 * @param {*} tbody
 * @returns
 */
function getTotal(tbody) {
    const line = document.createElement('tr')
    line.appendChild(newCell('td', 'Total'))

    let totalColumn
    try {
        totalColumn = tbody.getElementsByTagName('tr')[0].getElementsByTagName('td').length
    } catch (error) {
        totalColumn = 0
    }
    for (let i = 1; i < totalColumn; i++) {
        let totalByDay = 0
        let totalByDay2 = 0
        tbody.getElementsByTagName('tr').forEach(element => {
            let mainDiv = element.getElementsByTagName('td')[i].children[0]
            totalByDay += parseInt(mainDiv.firstChild.innerText)
            if (mainDiv.children.length === 2)
                totalByDay2 += parseInt(mainDiv.children[1].innerText)
            else
                totalByDay2 += parseInt(mainDiv.firstChild.innerText)
        })
        let text = ''
        if (!isNaN(totalByDay)) {
            text += totalByDay
            if (totalByDay2 != totalByDay) {
                text += ", " + totalByDay2
            }
        }
        line.appendChild(newCell('td', text, 'text-align: center;'))
    }
    return line
}

/**
 *
 * @param {*} type
 * @param {*} data
 * @param {*} style
 * @returns
 */
function newCell(type, data, style = '') {
    const myCase = document.createElement(type)
    myCase.setAttribute('style', style)
    myCase.innerText = data
    return myCase
}

/**
 * Header of table
 * @param {*} from
 * @param {*} to
 * @returns
 */
function getHeader(from, to, tablePersonne = false) {
    const line = document.createElement('tr')
    let titre = (tablePersonne) ? 'Personne' : 'Lieu'
    line.appendChild(newCell('th', titre))
    if (tablePersonne)
        line.appendChild(newCell('th', 'Clés'))
    while (from <= to) {
        line.appendChild(newCell('th', daysFr[from.getDay()] + '\n' + from.toLocaleDateString()))
        from.setDate(from.getDate() + 1)
    }
    return line
}


/**
 * Creates an 'tr' element with given values
 * @param {Array} values 
 * @returns 
 */
function getHeaderWithValues(values) {
    const line = document.createElement('tr')
    values.forEach(value => {
        line.appendChild(newCell('th', value))
    })
    return line
}

/**
 * Fills the content of the table from the values of the header starting at index "startIndex"
 * @param {*} tbody
 * @param {*} headerLine
 * @param {*} startIndex
 * @param {*} userListEvents
 * @param {*} icons
 * @param {*} count
 * @returns
 */
function getContent(tbody, headerLine, startIndex, userListEvents, type, icons = null, whitelistKeys = null) {
    const line = document.createElement('tr')
    let td = newCell('td', userListEvents.id)
    line.appendChild(td)
    let placeIsExcluded
    if (type === "byEmployee") {
        let iconsCell = newCell('td', '')
        line.appendChild(iconsCell)
        icons = groupBy(icons, "person")
        let tetra = Events.compute_tetragraph(userListEvents.id)
        if (icons[tetra] != undefined)
            setTitleWithIcons(iconsCell, icons[tetra], true)
    }
    else if (type === 'byLocation')
        placeIsExcluded = !whitelistKeys.includes(userListEvents.id)

    let counter = 0
    headerLine.children.forEach(elem => {
        if (counter >= startIndex) {
            let value
            if (type === 'byEmployee' || type === 'byLocation') {
                let today = new Date(document.getElementById('dtStart').valueAsDate)
                today.setDate(today.getDate() + counter - startIndex)
                value = today
            }
            else if (type === 'HRsummary') {
                value = elem.innerText
            }


            if (type === "byEmployee") {
                line.appendChild(userListEvents.eventsAtDay(value))
            } else if (type === 'byLocation') {
                line.appendChild(userListEvents.eventsAtDayCount(value, icons, placeIsExcluded))
            } else if (type === 'HRsummary') {
                line.appendChild(userListEvents.countTypeForUser(value))
            }
        }

        counter += 1
    })
    tbody.appendChild(line)
    return tbody
}


/**
 * 
 * @param {Array} dataSent 
 * @param {*} response 
 */
export function newTableHR(dataSent, response) {
    const tableName = 'HRsummary'
    const table = document.createElement('table')
    const thead = document.createElement('thead')
    let tbody = document.createElement('tbody')
    const tfoot = document.createElement('tfoot')

    table.setAttribute('id', tableName)
    table.setAttribute('class', 'table table-striped')

    const headerValues = [
        'Personne',
        'RTT',
        'Congés',
        'Astreinte',
        'Férié',
        'Total'
    ]
    const head = getHeaderWithValues(headerValues)
    thead.appendChild(head)

    const res = JSON.parse(response)
    console.log(res)
    Object.keys(res).forEach(element => {
        const userListEvents = new ListEvents(element, res[element])
        tbody = getContent(tbody, head, 1, userListEvents, tableName)

    })

    tfoot.appendChild(getHeaderWithValues(headerValues))

    table.appendChild(thead)
    table.appendChild(tbody)
    table.appendChild(tfoot)
    document.getElementById('myapp').innerHTML = ''
    document.getElementById('myapp').appendChild(table)
    new DataTable('#' + tableName, optionDatatable1)
}