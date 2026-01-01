package com.quickmenu.config.customExceptions;

public class TableOccupiedException extends RuntimeException {

    public TableOccupiedException() {
        super("The table is already occupied.");
    }

    public TableOccupiedException(String message) {
        super(message);
    }
}