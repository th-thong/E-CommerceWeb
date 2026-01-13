"use client"

import { useState, useEffect } from "react"
import { getProfile, updateProfile } from "@/api/auth"
import BackgroundAnimation from "@/components/Common/BackgroundAnimation/BackgroundAnimation"
import Navbar from "@/components/Layout/Navbar/Navbar"
import "./User.css"
import { retryWithRefreshToken } from '../../api/client';

const Account = () => {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState(null)
  
  // Form fields
  const [formData, setFormData] = useState({
    user_name: "",
    phone_number: "",
    address: "",
  })

  const getToken = () => {
    const saved = localStorage.getItem("auth_tokens")
    if (saved) {
      try {
        const tokens = JSON.parse(saved)
        return tokens.access
      } catch {
        return null
      }
    }
    return null
  }

  const fetchProfile = async () => {
    const token = getToken()
    if (!token) {
      setError("Vui lòng đăng nhập để xem thông tin tài khoản")
      setLoading(false)
      return
    }
    try {
      const data = await retryWithRefreshToken(getProfile, token)
      setProfile(data)
      setFormData({
        user_name: data.user_name || "",
        phone_number: data.phone_number || "",
        address: data.address === "None" ? "" : (data.address || ""),
      })
    } catch (err) {
      setError(err.message || "Không thể tải thông tin tài khoản")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    const token = getToken()
    if (!token) {
      setError("Vui lòng đăng nhập lại")
      return
    }

    setSaving(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const updatedProfile = await updateProfile(token, formData)
      setProfile(updatedProfile)
      setIsEditing(false)
      setSuccessMsg("Cập nhật thông tin thành công!")
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err) {
      setError(err.message || "Không thể cập nhật thông tin")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      user_name: profile?.user_name || "",
      phone_number: profile?.phone_number || "",
      address: profile?.address === "None" ? "" : (profile?.address || ""),
    })
    setIsEditing(false)
    setError(null)
  }

  return (
    <div className="container">
      <BackgroundAnimation />
      <Navbar />
      <div className="user-page">
        <div className="user-content">
          <h1>Tài Khoản Của Tôi</h1>
          
          {loading && <p className="loading">Đang tải...</p>}
          {error && <p className="error">{error}</p>}
          {successMsg && <p className="success">{successMsg}</p>}
          
          {!loading && !error && profile && (
            <div className="profile-card">
              <div className="profile-avatar">
                {(profile.user_name?.[0] || profile.email?.[0] || "U").toUpperCase()}
              </div>
              
              <div className="profile-info">
                {/* Tên người dùng */}
                <div className="info-row">
                  <label>Tên người dùng:</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="user_name"
                      value={formData.user_name}
                      onChange={handleInputChange}
                      className="edit-input"
                      placeholder="Nhập tên người dùng"
                    />
                  ) : (
                    <span>{profile.user_name || "Chưa cập nhật"}</span>
                  )}
                </div>

                {/* Email (không cho sửa) */}
                <div className="info-row">
                  <label>Email:</label>
                  <span>{profile.email}</span>
                </div>

                {/* Số điện thoại */}
                <div className="info-row">
                  <label>Số điện thoại:</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleInputChange}
                      className="edit-input"
                      placeholder="Nhập số điện thoại"
                    />
                  ) : (
                    <span>{profile.shop_phone_number || profile.phone_number || "Chưa cập nhật"}</span>
                  )}
                </div>

                {/* Địa chỉ */}
                <div className="info-row">
                  <label>Địa chỉ:</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="edit-input"
                      placeholder="Nhập địa chỉ"
                    />
                  ) : (
                    <span>{profile.address === "None" ? "Chưa cập nhật" : profile.address}</span>
                  )}
                </div>

                {/* Trạng thái (không cho sửa) */}
                <div className="info-row">
                  <label>Trạng thái:</label>
                  <span className={`status-badge ${profile.status}`}>
                    {profile.status === "active" ? "Hoạt động" : profile.status === "banned" ? "Đã khóa" : profile.status}
                  </span>
                </div>

                {/* Buttons */}
                <div className="profile-actions">
                  {isEditing ? (
                    <>
                      <button 
                        className="btn-save" 
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                      </button>
                      <button 
                        className="btn-cancel" 
                        onClick={handleCancel}
                        disabled={saving}
                      >
                        Hủy
                      </button>
                    </>
                  ) : (
                    <button className="btn-edit" onClick={() => setIsEditing(true)}>
                      ✏️ Chỉnh sửa thông tin
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Account
