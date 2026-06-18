package com.prode.mundial_2026.dto;

public class FiltroPrediccionUsuarioDTO {
    private String apellido;
    private String nombre;
    private Long codigoPlanilla;

    // Constructor explícito exigido por Hibernate
    public FiltroPrediccionUsuarioDTO(String apellido, String nombre, Long codigoPlanilla) {
        this.apellido = apellido;
        this.nombre = nombre;
        this.codigoPlanilla = codigoPlanilla;
    }

    // Constructor vacío
    public FiltroPrediccionUsuarioDTO() {
    }

    // Getters y Setters manuales (para asegurar compatibilidad absoluta)
    public String getApellido() {
        return apellido;
    }

    public void setApellido(String apellido) {
        this.apellido = apellido;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public Long getCodigoPlanilla() {
        return codigoPlanilla;
    }

    public void setCodigoPlanilla(Long codigoPlanilla) {
        this.codigoPlanilla = codigoPlanilla;
    }
}