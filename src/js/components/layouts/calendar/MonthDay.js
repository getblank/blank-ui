import React from "react";
import MonthDayEvents from "./MonthDayEvents";

const s = {
    calendarDay: {
        flex: "2 0",
        display: "flex",
        flexDirection: "column",
        padding: "4px",
        position: "relative",
        //Workaround for flex children text-overflow
        minWidth: 0,
        // borderRight: "1px solid rgba(0,0,0,.12)",
    },
    calendarDayDate: {
        flex: "0 0",
        fontSize: "1.3rem",
        fontWeight: 100,
    },
    events: {
        flex: "2 0",
        display: "flex",
        flexDirection: "column",
    },
    selectedCalendarDay: {
        backgroundColor: "#EDE7F6",
    },
    mute: {
        color: "#aaa",
    },
    today: {
        height: 4,
        background: "#2396F3",
        width: "100%",
        position: "absolute",
        top: 0,
        left: 0,
    },
};

const MonthDay = ({ moment, date, month, selected, events, className, colorProp, onClick }) => {
    const dayClickHandler = (e) => {
        onClick(e, date, selected);
    };
    const mouseOverHandler = (e) => {
        e.currentTarget.style.backgroundColor = "#f0f0f0";
    };
    const mouseOutHandler = (e) => {
        e.currentTarget.style.backgroundColor = "";
    };
    const dayStyle = Object.assign({}, s.calendarDay, date.month() !== month && s.mute, {
        cursor: selected ? "copy" : "pointer",
    });
    return (
        <div
            style={dayStyle}
            onClick={dayClickHandler}
            onMouseOver={mouseOverHandler}
            onMouseOut={mouseOutHandler}
            className={className}
        >
            {date.isSame(moment(), "day") && <div style={s.today} />}
            <span style={s.calendarDayDate}>{date.date()}</span>
            <div style={s.events}>
                <MonthDayEvents events={events} colorProp={colorProp} />
            </div>
        </div>
    );
};

export default MonthDay;
